package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.infrastructure.storage.LegacyStorageFixture;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assumptions.assumeFalse;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.application.port.RenderPort;
import com.toonlira.translationgateway.application.port.RenderingTaskProcessPort;
import com.toonlira.translationgateway.application.port.RenderingJobRepository;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.OriginalObjectKey;
import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import com.toonlira.translationgateway.infrastructure.storage.LocalObjectStorageAdapter;
import java.io.FilterInputStream;
import java.io.InputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.ObjectProvider;

class ProcessRenderingTaskUseCaseTest {
    private static final Instant NOW = Instant.parse("2026-10-03T12:00:00Z");
    private static final ObjectMapper MAPPER = GatewayJsonMapper.create();
    @TempDir Path temporary;
    private final CleanupLifecycleObjectsUseCase lifecycle = mock(CleanupLifecycleObjectsUseCase.class);

    @Test
    void supervisedModeRoutesWholeTaskWithoutParentStorageOrCleanup() throws Exception {
        var fixture = fixture();
        fixture.properties().getRendering().setMode(GatewayProperties.Rendering.Mode.SUPERVISED_NATIVE);
        fixture.properties().getRendering().setStorageProcessEnabled(true);
        var task = worker(fixture);
        var processes = mock(RenderingTaskProcessPort.class);
        ObjectProvider<RenderingTaskProcessPort> provider = mock(ObjectProvider.class);
        when(provider.getObject()).thenReturn(processes);
        task.configureProcesses(provider);
        task.execute(fixture.job().jobRef());
        verify(processes).execute(fixture.job());
        verify(fixture.storage(), never()).open(any());
        verify(fixture.storage(), never()).delete(any());
        verifyNoInteractions(fixture.renderer());
    }

    @Test
    void disabledDoesNotResolveRendererOrAccessDatabaseAndStorage() {
        var persistence = mock(RenderingPersistenceUseCase.class);
        var storage = mock(ObjectStoragePort.class);
        var renderer = mock(ObjectProvider.class);
        worker(persistence, storage, renderer, new GatewayProperties()).execute(UUID.randomUUID());
        verifyNoInteractions(persistence, storage, renderer, lifecycle);
    }

    @Test
    void unknownJobDoesNotReadStorage() throws Exception {
        var fixture = fixture();
        assertThatThrownBy(() -> worker(fixture).execute(UUID.randomUUID())).isInstanceOf(GatewayException.class)
            .extracting("code").isEqualTo(GatewayErrorCode.JOB_NOT_FOUND);
        verify(fixture.storage(), never()).open(any());
        verifyNoInteractions(lifecycle);
    }

    @Test
    void commitsVerifiedImageAndManifestAndRemovesOnlyRemoteOriginal() throws Exception {
        var fixture = fixture();
        var originals = Files.readAllBytes(temporary.resolve(fixture.job().originalObjectKey()));
        when(fixture.persistence().complete(any(), any(), any())).thenAnswer(call -> {
            RenderingJobRepository.Artifacts artifacts = call.getArgument(1);
            assertThat(Files.exists(temporary.resolve(fixture.job().originalObjectKey()))).isTrue();
            assertThat(hash(Files.readAllBytes(temporary.resolve(artifacts.imageObjectKey()))))
                .isEqualTo(artifacts.image().sha256());
            assertThat(hash(Files.readAllBytes(temporary.resolve(artifacts.manifestObjectKey()))))
                .isEqualTo(artifacts.manifestSha256());
            fixture.current().set(with(fixture.job(), JobStatus.READY, artifacts));
            return true;
        });
        worker(fixture).execute(fixture.job().jobRef());
        assertThat(renderFiles()).isEmpty();
        assertThat(Files.exists(temporary.resolve(fixture.job().originalObjectKey()))).isFalse();
        assertThat(Files.readAllBytes(fixture.reusable())).isEqualTo(originals);
        assertThat(finalObjects()).hasSize(2);
        verify(fixture.renderer(), times(1)).render(any(), any());
        verify(fixture.persistence(), never()).fail(any(), any(), any());
        verify(lifecycle).executeForJob(fixture.job().id());
    }

    @Test
    void cleanupFailureIsSanitizedAndOtherOwnedFilesAreStillRemoved() throws Exception {
        assumeTrue(Files.getFileStore(temporary).supportsFileAttributeView("posix"));
        var fixture = fixture();
        var locked = Files.createDirectory(temporary.resolve("locked-cleanup"));
        var leaked = Files.writeString(locked.resolve("private-snapshot"), "synthetic");
        var inspector = spy(new MediaInspectionService(new MediaInspectionService.CleanupState()));
        var injected = new java.util.concurrent.atomic.AtomicBoolean();
        doAnswer(call -> {
            if (injected.compareAndSet(false, true)) inspector.deleteQuietly(leaked);
            return call.callRealMethod();
        }).when(inspector).deleteQuietly(any());
        when(fixture.persistence().complete(any(), any(), any())).thenReturn(true);
        ObjectProvider<RenderPort> provider = mock(ObjectProvider.class);
        when(provider.getObject()).thenReturn(fixture.renderer());
        try {
            Files.setPosixFilePermissions(locked, PosixFilePermissions.fromString("r-x------"));
            assumeFalse(Files.isWritable(locked), "fixture requires enforced directory permissions");
            assertThatThrownBy(() -> worker(fixture.persistence(), fixture.storage(), provider, fixture.properties(),
                    Clock.fixed(NOW, ZoneOffset.UTC), inspector).execute(fixture.job().jobRef()))
                .isInstanceOfSatisfying(GatewayException.class, error -> {
                    assertThat(error.code()).isEqualTo(GatewayErrorCode.STORAGE_UNAVAILABLE);
                    assertThat(error.getMessage()).isEqualTo("storage-unavailable");
                    assertThat(error.getCause()).isNull();
                });
            assertThat(Files.exists(leaked)).isTrue();
            assertThat(renderFiles()).isEmpty();
            assertThat(finalObjects()).hasSize(2);
            verify(fixture.persistence()).complete(any(), any(), any());
        } finally {
            Files.setPosixFilePermissions(locked, PosixFilePermissions.fromString("rwx------"));
            Files.deleteIfExists(leaked);
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"original", "ocr", "translation", "expired", "dimensions", "pair", "job"})
    void invalidInputFailsBeforeReservation(String fault) throws Exception {
        var fixture = fixture();
        if (fault.equals("original")) Files.writeString(temporary.resolve(fixture.job().originalObjectKey()), "invalid");
        if (fault.equals("ocr")) Files.writeString(temporary.resolve(fixture.job().ocrObjectKey()), "invalid");
        if (fault.equals("translation")) Files.writeString(temporary.resolve(fixture.job().translationObjectKey()), "invalid");
        if (fault.equals("expired")) fixture.current().set(copy(fixture.job(), fixture.job().source(), "en", "pt-BR", NOW.minusSeconds(3600), fixture.job().jobRef()));
        if (fault.equals("dimensions")) fixture.current().set(copy(fixture.job(), new RenderSource("image/png", fixture.job().source().byteSize(), 3, 2,
            fixture.job().source().sha256()), "en", "pt-BR", NOW.minusSeconds(1), fixture.job().jobRef()));
        if (fault.equals("pair")) fixture.current().set(copy(fixture.job(), fixture.job().source(), "en", "ja", NOW.minusSeconds(1), fixture.job().jobRef()));
        if (fault.equals("job")) fixture.current().set(copy(fixture.job(), fixture.job().source(), "en", "pt-BR", NOW.minusSeconds(1), UUID.randomUUID()));
        worker(fixture).execute(fixture.job().jobRef());
        verify(fixture.persistence()).failUnclaimed(eq(fixture.job().id()), eq(GatewayErrorCode.INTERNAL_ERROR), eq(NOW));
        verify(fixture.persistence(), never()).claim(any(), any());
        verifyNoInteractions(fixture.renderer());
        assertThat(finalObjects()).isEmpty();
    }

    @Test
    void competingReservationDoesNotRenderOrRemoveOriginal() throws Exception {
        var fixture = fixture();
        when(fixture.persistence().claim(any(), any())).thenReturn(RenderingJobRepository.Claim.ALREADY_HANDLED);
        worker(fixture).execute(fixture.job().jobRef());
        verifyNoInteractions(fixture.renderer());
        assertThat(Files.exists(temporary.resolve(fixture.job().originalObjectKey()))).isTrue();
    }

    @Test
    void deadlineReachedWhileReadingManifestsPreventsOpeningOriginal() throws Exception {
        var fixture = fixture();
        var time = new AtomicReference<>(NOW);
        var clock = mock(Clock.class);
        when(clock.instant()).thenAnswer(call -> time.get());
        doAnswer(call -> {
            var stream = call.callRealMethod();
            time.set(NOW.plusSeconds(3600));
            return stream;
        }).when(fixture.storage()).open(fixture.job().translationObjectKey());
        ObjectProvider<RenderPort> provider = mock(ObjectProvider.class);
        when(provider.getObject()).thenReturn(fixture.renderer());
        worker(fixture.persistence(), fixture.storage(), provider, fixture.properties(), clock).execute(fixture.job().jobRef());
        verify(fixture.storage(), never()).open(fixture.job().originalObjectKey());
        verify(fixture.persistence()).failUnclaimed(eq(fixture.job().id()), eq(GatewayErrorCode.INTERNAL_ERROR), eq(NOW.plusSeconds(3600)));
        verify(fixture.persistence(), never()).claim(any(), any());
        verifyNoInteractions(fixture.renderer());
        assertThat(finalObjects()).isEmpty();
    }

    @Test
    void deadlineReachedWhileReadingOriginalPreventsReservationAndRender() throws Exception {
        var fixture = fixture();
        var time = new AtomicReference<>(NOW);
        var clock = mock(Clock.class);
        when(clock.instant()).thenAnswer(call -> time.get());
        doAnswer(call -> new java.io.FilterInputStream((java.io.InputStream) call.callRealMethod()) {
            @Override public void close() throws java.io.IOException {
                super.close();
                time.set(NOW.plusSeconds(3600));
            }
        }).when(fixture.storage()).open(fixture.job().originalObjectKey());
        ObjectProvider<RenderPort> provider = mock(ObjectProvider.class);
        when(provider.getObject()).thenReturn(fixture.renderer());
        worker(fixture.persistence(), fixture.storage(), provider, fixture.properties(), clock).execute(fixture.job().jobRef());
        verify(fixture.persistence()).failUnclaimed(eq(fixture.job().id()), eq(GatewayErrorCode.INTERNAL_ERROR), eq(NOW.plusSeconds(3600)));
        verify(fixture.persistence(), never()).claim(any(), any());
        verifyNoInteractions(fixture.renderer());
        assertThat(renderFiles()).isEmpty();
        assertThat(finalObjects()).isEmpty();
    }

    @Test
    void deadlineReachedDuringBlockReadStopsFurtherOriginalReads() throws Exception {
        var fixture = fixture();
        var time = new AtomicReference<>(NOW);
        var reads = new java.util.concurrent.atomic.AtomicInteger();
        var clock = mock(Clock.class);
        when(clock.instant()).thenAnswer(call -> time.get());
        doAnswer(call -> new java.io.FilterInputStream((java.io.InputStream) call.callRealMethod()) {
            @Override public int read(byte[] buffer, int offset, int length) throws java.io.IOException {
                reads.incrementAndGet();
                int count = super.read(buffer, offset, length);
                time.set(NOW.plusSeconds(3600));
                return count;
            }
        }).when(fixture.storage()).open(fixture.job().originalObjectKey());
        ObjectProvider<RenderPort> provider = mock(ObjectProvider.class);
        when(provider.getObject()).thenReturn(fixture.renderer());
        worker(fixture.persistence(), fixture.storage(), provider, fixture.properties(), clock).execute(fixture.job().jobRef());
        assertThat(reads).hasValue(1);
        verify(fixture.persistence()).failUnclaimed(eq(fixture.job().id()), eq(GatewayErrorCode.INTERNAL_ERROR), eq(NOW.plusSeconds(3600)));
        verify(fixture.persistence(), never()).claim(any(), any());
        verifyNoInteractions(fixture.renderer());
        assertThat(renderFiles()).isEmpty();
        assertThat(finalObjects()).isEmpty();
    }

    @Test
    void shorterEmbeddedOriginalDeadlineStopsReadBeforeTheOneHourFailsafe() throws Exception {
        var fixture = fixture();
        var current = fixture.job();
        var key = OriginalObjectKey.create(NOW, 30);
        fixture.delegate().store(key, fixture.reusable(), "image/png", current.source().sha256(), NOW);
        var job = new RenderingJobRepository.WorkItem(current.id(), current.jobRef(), current.status(), key, current.source(),
            current.sourceLanguage(), current.targetLanguage(), current.createdAt(), current.ocrObjectKey(), current.ocrSha256(),
            current.translationObjectKey(), current.translationSha256(), null, current.resultRetentionSeconds());
        fixture.current().set(job);
        var time = new AtomicReference<>(NOW);
        var reads = new java.util.concurrent.atomic.AtomicInteger();
        var clock = mock(Clock.class);
        when(clock.instant()).thenAnswer(call -> time.get());
        doAnswer(call -> new java.io.FilterInputStream((java.io.InputStream) call.callRealMethod()) {
            @Override public int read(byte[] buffer, int offset, int length) throws java.io.IOException {
                reads.incrementAndGet();
                int count = super.read(buffer, offset, length);
                time.set(NOW.plusSeconds(30));
                return count;
            }
        }).when(fixture.storage()).open(key);
        ObjectProvider<RenderPort> provider = mock(ObjectProvider.class);
        when(provider.getObject()).thenReturn(fixture.renderer());
        worker(fixture.persistence(), fixture.storage(), provider, fixture.properties(), clock).execute(job.jobRef());
        assertThat(reads).hasValue(1);
        verify(fixture.persistence()).failUnclaimed(eq(job.id()), eq(GatewayErrorCode.INTERNAL_ERROR), eq(NOW.plusSeconds(30)));
        verify(fixture.persistence(), never()).claim(any(), any());
        verifyNoInteractions(fixture.renderer());
        assertThat(renderFiles()).isEmpty();
    }

    @Test
    void blockedOriginalReadFailsAndCleansAfterReturningPastDeadline() throws Exception {
        var fixture = fixture();
        var time = new AtomicReference<>(NOW);
        var clock = mock(Clock.class);
        when(clock.instant()).thenAnswer(call -> time.get());
        var entered = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        doAnswer(call -> new java.io.FilterInputStream((java.io.InputStream) call.callRealMethod()) {
            @Override public int read(byte[] buffer, int offset, int length) throws java.io.IOException {
                entered.countDown();
                try {
                    if (!release.await(5, TimeUnit.SECONDS)) throw new java.io.IOException("test-timeout");
                } catch (InterruptedException error) {
                    Thread.currentThread().interrupt();
                    throw new java.io.IOException("test-interrupted", error);
                }
                return super.read(buffer, offset, length);
            }
        }).when(fixture.storage()).open(fixture.job().originalObjectKey());
        ObjectProvider<RenderPort> provider = mock(ObjectProvider.class);
        when(provider.getObject()).thenReturn(fixture.renderer());
        var executor = Executors.newSingleThreadExecutor();
        try {
            var running = executor.submit(() -> worker(fixture.persistence(), fixture.storage(), provider, fixture.properties(), clock)
                .execute(fixture.job().jobRef()));
            assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue();
            time.set(NOW.plusSeconds(3600));
            assertThat(running.isDone()).isFalse();
            release.countDown();
            running.get(5, TimeUnit.SECONDS);
            verify(fixture.persistence()).failUnclaimed(eq(fixture.job().id()), eq(GatewayErrorCode.INTERNAL_ERROR), eq(NOW.plusSeconds(3600)));
            verify(fixture.persistence(), never()).claim(any(), any());
            verifyNoInteractions(fixture.renderer());
            assertThat(renderFiles()).isEmpty();
            assertThat(finalObjects()).isEmpty();
        } finally {
            release.countDown();
            executor.shutdownNow();
            assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
        }
    }

    @Test
    void blockedOriginalOpenFailsAndClosesStreamAfterReturningPastDeadline() throws Exception {
        var fixture = fixture();
        var time = new AtomicReference<>(NOW);
        var clock = mock(Clock.class);
        when(clock.instant()).thenAnswer(call -> time.get());
        var entered = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var closed = new java.util.concurrent.atomic.AtomicBoolean();
        doAnswer(call -> {
            entered.countDown();
            if (!release.await(5, TimeUnit.SECONDS)) throw new IllegalStateException("test-timeout");
            return new java.io.FilterInputStream((java.io.InputStream) call.callRealMethod()) {
                @Override public void close() throws java.io.IOException {
                    super.close();
                    closed.set(true);
                }
            };
        }).when(fixture.storage()).open(fixture.job().originalObjectKey());
        ObjectProvider<RenderPort> provider = mock(ObjectProvider.class);
        when(provider.getObject()).thenReturn(fixture.renderer());
        var executor = Executors.newSingleThreadExecutor();
        try {
            var running = executor.submit(() -> worker(fixture.persistence(), fixture.storage(), provider, fixture.properties(), clock)
                .execute(fixture.job().jobRef()));
            assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue();
            time.set(NOW.plusSeconds(3600));
            assertThat(running.isDone()).isFalse();
            release.countDown();
            running.get(5, TimeUnit.SECONDS);
            assertThat(closed).isTrue();
            verify(fixture.persistence()).failUnclaimed(eq(fixture.job().id()), eq(GatewayErrorCode.INTERNAL_ERROR), eq(NOW.plusSeconds(3600)));
            verify(fixture.persistence(), never()).claim(any(), any());
            verifyNoInteractions(fixture.renderer());
            assertThat(renderFiles()).isEmpty();
            assertThat(finalObjects()).isEmpty();
        } finally {
            release.countDown();
            executor.shutdownNow();
            assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
        }
    }

    @Test
    void deadlineSignalsBlockedOriginalReadAndCleansSnapshot() throws Exception {
        var fixture = fixture();
        var current = fixture.job();
        var key = OriginalObjectKey.create(NOW, 2);
        fixture.delegate().store(key, fixture.reusable(), "image/png", current.source().sha256(), NOW);
        var job = new RenderingJobRepository.WorkItem(current.id(), current.jobRef(), current.status(), key, current.source(),
            current.sourceLanguage(), current.targetLanguage(), current.createdAt(), current.ocrObjectKey(), current.ocrSha256(),
            current.translationObjectKey(), current.translationSha256(), null, current.resultRetentionSeconds());
        fixture.current().set(job);
        var clock = Clock.offset(Clock.systemUTC(), Duration.between(Instant.now(), NOW));
        var entered = new CountDownLatch(1);
        var signalled = new java.util.concurrent.atomic.AtomicBoolean();
        doAnswer(call -> new java.io.FilterInputStream((java.io.InputStream) call.callRealMethod()) {
            @Override public int read(byte[] buffer, int offset, int length) throws java.io.IOException {
                entered.countDown();
                try { new CountDownLatch(1).await(); }
                catch (InterruptedException expected) {
                    signalled.set(true);
                    Thread.currentThread().interrupt();
                    throw new java.io.IOException("synthetic-interrupted");
                }
                throw new AssertionError("unreachable");
            }
        }).when(fixture.storage()).open(key);
        ObjectProvider<RenderPort> provider = mock(ObjectProvider.class);
        when(provider.getObject()).thenReturn(fixture.renderer());
        var inspector = spy(new MediaInspectionService());
        var deletedSnapshot = new AtomicReference<Path>();
        doAnswer(call -> { deletedSnapshot.set(call.getArgument(0)); return call.callRealMethod(); })
            .when(inspector).deleteQuietly(any());
        var worker = Thread.ofPlatform().start(() -> worker(fixture.persistence(), fixture.storage(), provider, fixture.properties(), clock, inspector)
            .execute(job.jobRef()));
        try {
            assertThat(entered.await(1, TimeUnit.SECONDS)).isTrue();
            worker.join(4000);
            assertThat(worker.isAlive()).isFalse();
            assertThat(signalled).isTrue();
        } finally {
            worker.interrupt();
            worker.join(2000);
        }
        verify(fixture.persistence()).failUnclaimed(eq(job.id()), eq(GatewayErrorCode.INTERNAL_ERROR), any());
        verify(fixture.persistence(), never()).claim(any(), any());
        verifyNoInteractions(fixture.renderer());
        assertThat(deletedSnapshot.get()).isNotNull();
        assertThat(Files.exists(deletedSnapshot.get())).isFalse();
        assertThat(renderFiles()).isEmpty();
        assertThat(finalObjects()).isEmpty();
    }

    @Test
    void deadlineSignalsBlockedManifestReadBeforeOpeningOriginal() throws Exception {
        var fixture = fixture();
        var current = fixture.job();
        var key = OriginalObjectKey.create(NOW, 2);
        var job = new RenderingJobRepository.WorkItem(current.id(), current.jobRef(), current.status(), key, current.source(),
            current.sourceLanguage(), current.targetLanguage(), current.createdAt(), current.ocrObjectKey(), current.ocrSha256(),
            current.translationObjectKey(), current.translationSha256(), null, current.resultRetentionSeconds());
        fixture.current().set(job);
        var clock = Clock.offset(Clock.systemUTC(), Duration.between(Instant.now(), NOW));
        var entered = new CountDownLatch(1);
        var signalled = new java.util.concurrent.atomic.AtomicBoolean();
        doAnswer(call -> new java.io.FilterInputStream((java.io.InputStream) call.callRealMethod()) {
            @Override public int read(byte[] buffer, int offset, int length) throws java.io.IOException {
                entered.countDown();
                try { new CountDownLatch(1).await(); }
                catch (InterruptedException expected) {
                    signalled.set(true);
                    Thread.currentThread().interrupt();
                    throw new java.io.IOException("synthetic-interrupted");
                }
                throw new AssertionError("unreachable");
            }
        }).when(fixture.storage()).open(job.ocrObjectKey());
        ObjectProvider<RenderPort> provider = mock(ObjectProvider.class);
        when(provider.getObject()).thenReturn(fixture.renderer());
        var worker = Thread.ofPlatform().start(() -> worker(fixture.persistence(), fixture.storage(), provider, fixture.properties(), clock)
            .execute(job.jobRef()));
        try {
            assertThat(entered.await(1, TimeUnit.SECONDS)).isTrue();
            worker.join(4000);
            assertThat(worker.isAlive()).isFalse();
            assertThat(signalled).isTrue();
        } finally {
            worker.interrupt();
            worker.join(2000);
        }
        verify(fixture.storage(), never()).open(key);
        verify(fixture.persistence()).failUnclaimed(eq(job.id()), eq(GatewayErrorCode.INTERNAL_ERROR), any());
        verify(fixture.persistence(), never()).claim(any(), any());
        verifyNoInteractions(fixture.renderer());
        assertThat(renderFiles()).isEmpty();
        assertThat(finalObjects()).isEmpty();
    }

    @Test
    void uninterruptibleOriginalReadKeepsOwnershipUntilItReturns() throws Exception {
        var fixture = fixture();
        var current = fixture.job();
        var key = OriginalObjectKey.create(NOW, 2);
        fixture.delegate().store(key, fixture.reusable(), "image/png", current.source().sha256(), NOW);
        var job = new RenderingJobRepository.WorkItem(current.id(), current.jobRef(), current.status(), key, current.source(),
            current.sourceLanguage(), current.targetLanguage(), current.createdAt(), current.ocrObjectKey(), current.ocrSha256(),
            current.translationObjectKey(), current.translationSha256(), null, current.resultRetentionSeconds());
        fixture.current().set(job);
        var clock = Clock.offset(Clock.systemUTC(), Duration.between(Instant.now(), NOW));
        var entered = new CountDownLatch(1);
        var interrupted = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        doAnswer(call -> new java.io.FilterInputStream((java.io.InputStream) call.callRealMethod()) {
            @Override public int read(byte[] buffer, int offset, int length) throws java.io.IOException {
                entered.countDown();
                while (true) {
                    try { if (release.await(5, TimeUnit.SECONDS)) break; else throw new java.io.IOException("test-timeout"); }
                    catch (InterruptedException expected) { interrupted.countDown(); }
                }
                return super.read(buffer, offset, length);
            }
        }).when(fixture.storage()).open(key);
        ObjectProvider<RenderPort> provider = mock(ObjectProvider.class);
        when(provider.getObject()).thenReturn(fixture.renderer());
        var inspector = spy(new MediaInspectionService());
        var deletedSnapshot = new AtomicReference<Path>();
        doAnswer(call -> { deletedSnapshot.set(call.getArgument(0)); return call.callRealMethod(); })
            .when(inspector).deleteQuietly(any());
        var worker = Thread.ofPlatform().start(() -> worker(fixture.persistence(), fixture.storage(), provider, fixture.properties(), clock, inspector)
            .execute(job.jobRef()));
        try {
            assertThat(entered.await(1, TimeUnit.SECONDS)).isTrue();
            assertThat(interrupted.await(4, TimeUnit.SECONDS)).isTrue();
            assertThat(worker.isAlive()).isTrue();
            verify(inspector, never()).deleteQuietly(any());
            verify(fixture.persistence(), never()).claim(any(), any());
        } finally {
            release.countDown();
            worker.join(5000);
        }
        assertThat(worker.isAlive()).isFalse();
        verify(fixture.persistence()).failUnclaimed(eq(job.id()), eq(GatewayErrorCode.INTERNAL_ERROR), any());
        verifyNoInteractions(fixture.renderer());
        assertThat(deletedSnapshot.get()).isNotNull();
        assertThat(Files.exists(deletedSnapshot.get())).isFalse();
        assertThat(renderFiles()).isEmpty();
        assertThat(finalObjects()).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"original", "ocr", "translation"})
    void deadlineClosesReadThatIgnoresInterruptionButRespondsToClose(String stage) throws Exception {
        var fixture = fixture();
        var current = fixture.job();
        var key = OriginalObjectKey.create(NOW, 2);
        fixture.delegate().store(key, fixture.reusable(), "image/png", current.source().sha256(), NOW);
        var job = new RenderingJobRepository.WorkItem(current.id(), current.jobRef(), current.status(), key, current.source(),
            current.sourceLanguage(), current.targetLanguage(), current.createdAt(), current.ocrObjectKey(), current.ocrSha256(),
            current.translationObjectKey(), current.translationSha256(), null, current.resultRetentionSeconds());
        fixture.current().set(job);
        var clock = Clock.offset(Clock.systemUTC(), Duration.between(Instant.now(), NOW));
        var entered = new CountDownLatch(1);
        var closed = new CountDownLatch(1);
        String blockedKey = switch (stage) {
            case "original" -> key;
            case "ocr" -> job.ocrObjectKey();
            default -> job.translationObjectKey();
        };
        doAnswer(call -> new FilterInputStream((InputStream) call.callRealMethod()) {
            @Override public int read(byte[] buffer, int offset, int length) throws IOException {
                entered.countDown();
                while (closed.getCount() != 0) {
                    try { closed.await(); }
                    catch (InterruptedException ignored) { /* Models a read requiring an explicit close. */ }
                }
                throw new IOException("synthetic-closed");
            }
            @Override public void close() throws IOException {
                closed.countDown();
                super.close();
            }
        }).when(fixture.storage()).open(blockedKey);
        ObjectProvider<RenderPort> provider = mock(ObjectProvider.class);
        when(provider.getObject()).thenReturn(fixture.renderer());
        var inspector = spy(new MediaInspectionService(new MediaInspectionService.CleanupState()));
        var deletedSnapshot = new AtomicReference<Path>();
        doAnswer(call -> { deletedSnapshot.set(call.getArgument(0)); return call.callRealMethod(); })
            .when(inspector).deleteQuietly(any());
        var running = Thread.ofPlatform().start(() -> worker(fixture.persistence(), fixture.storage(), provider,
            fixture.properties(), clock, inspector).execute(job.jobRef()));
        try {
            assertThat(entered.await(1, TimeUnit.SECONDS)).isTrue();
            assertThat(closed.await(4, TimeUnit.SECONDS)).as("deadline closes the active %s stream", stage).isTrue();
            running.join(2000);
            assertThat(running.isAlive()).isFalse();
            verify(fixture.persistence()).failUnclaimed(eq(job.id()), eq(GatewayErrorCode.INTERNAL_ERROR), any());
            verify(fixture.persistence(), never()).claim(any(), any());
            verifyNoInteractions(fixture.renderer());
            if (stage.equals("original")) {
                assertThat(deletedSnapshot.get()).isNotNull();
                assertThat(Files.exists(deletedSnapshot.get())).isFalse();
            }
            assertThat(renderFiles()).isEmpty();
            assertThat(finalObjects()).isEmpty();
        } finally {
            closed.countDown();
            running.interrupt();
            running.join(5000);
        }
    }

    @Test
    void expiredEmbeddedOriginalDeadlinePreventsOpeningStorage() throws Exception {
        var fixture = fixture();
        var current = fixture.job();
        var key = OriginalObjectKey.create(NOW, 30);
        var job = new RenderingJobRepository.WorkItem(current.id(), current.jobRef(), current.status(), key, current.source(),
            current.sourceLanguage(), current.targetLanguage(), current.createdAt(), current.ocrObjectKey(), current.ocrSha256(),
            current.translationObjectKey(), current.translationSha256(), null, current.resultRetentionSeconds());
        fixture.current().set(job);
        var clock = Clock.fixed(NOW.plusSeconds(30), java.time.ZoneOffset.UTC);
        ObjectProvider<RenderPort> provider = mock(ObjectProvider.class);
        when(provider.getObject()).thenReturn(fixture.renderer());

        worker(fixture.persistence(), fixture.storage(), provider, fixture.properties(), clock).execute(job.jobRef());

        verify(fixture.storage(), never()).open(key);
        verify(fixture.persistence()).failUnclaimed(eq(job.id()), eq(GatewayErrorCode.INTERNAL_ERROR), eq(NOW.plusSeconds(30)));
        verify(fixture.persistence(), never()).claim(any(), any());
        verifyNoInteractions(fixture.renderer());
        assertThat(renderFiles()).isEmpty();
    }

    @Test
    void originalDeadlineAlsoInterruptsRenderingAndCleansItsBorrowedSnapshot() throws Exception {
        var fixture = fixture();
        var current = fixture.job();
        var key = OriginalObjectKey.create(NOW, 2);
        fixture.delegate().store(key, fixture.reusable(), "image/png", current.source().sha256(), NOW);
        var job = new RenderingJobRepository.WorkItem(current.id(), current.jobRef(), current.status(), key, current.source(),
            current.sourceLanguage(), current.targetLanguage(), current.createdAt(), current.ocrObjectKey(), current.ocrSha256(),
            current.translationObjectKey(), current.translationSha256(), null, current.resultRetentionSeconds());
        fixture.current().set(job);
        var clock = Clock.offset(Clock.systemUTC(), Duration.between(Instant.now(), NOW));
        var entered = new CountDownLatch(1);
        var interrupted = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var snapshot = new AtomicReference<Path>();
        doAnswer(call -> {
            snapshot.set(call.getArgument(0));
            entered.countDown();
            try { release.await(); }
            catch (InterruptedException expected) { interrupted.countDown(); }
            throw new IllegalStateException("synthetic-render-cancelled");
        }).when(fixture.renderer()).render(any(), any());
        doAnswer(call -> { fixture.current().set(with(job, JobStatus.FAILED, null)); return null; })
            .when(fixture.persistence()).fail(eq(job.id()), any(), any());
        ObjectProvider<RenderPort> provider = mock(ObjectProvider.class);
        when(provider.getObject()).thenReturn(fixture.renderer());
        var running = Thread.ofPlatform().start(() -> worker(fixture.persistence(), fixture.storage(), provider,
            fixture.properties(), clock).execute(job.jobRef()));
        try {
            assertThat(entered.await(1, TimeUnit.SECONDS)).isTrue();
            assertThat(interrupted.await(4, TimeUnit.SECONDS)).as("original deadline applies during native work too").isTrue();
            running.join(2000);
            assertThat(running.isAlive()).isFalse();
            assertThat(Files.exists(snapshot.get())).isFalse();
            assertThat(Files.exists(temporary.resolve(key))).isFalse();
            assertThat(Files.exists(fixture.reusable())).isTrue();
            verify(fixture.persistence(), never()).complete(any(), any(), any());
            assertThat(finalObjects()).isEmpty();
        } finally {
            release.countDown();
            running.interrupt();
            running.join(5000);
        }
    }

    @ParameterizedTest
    @EnumSource(value = JobStatus.class, names = {"QUEUED", "OCR", "TRANSLATING", "READY", "FAILED", "CANCELLED", "RESULT_EXPIRED"})
    void otherStagesAndTerminalRedeliveriesHaveNoStorageOrRenderWork(JobStatus status) throws Exception {
        var fixture = fixture();
        fixture.current().set(with(fixture.job(), status, null));
        worker(fixture).execute(fixture.job().jobRef());
        verify(fixture.storage(), never()).open(any());
        verifyNoInteractions(fixture.renderer());
    }

    @Test
    void cancellationBeforeReservationLeavesRunningOwnerUntouched() throws Exception {
        var fixture = fixture();
        fixture.current().set(with(fixture.job(), JobStatus.CANCEL_PENDING, null));
        when(fixture.persistence().claim(any(), any())).thenReturn(RenderingJobRepository.Claim.ALREADY_HANDLED);
        worker(fixture).execute(fixture.job().jobRef());
        verify(fixture.storage(), never()).open(any());
        verify(fixture.storage(), never()).delete(any());
        verifyNoInteractions(fixture.renderer());
    }

    @Test
    void cancellationAtCommitRemovesBothUnreferencedOutputs() throws Exception {
        var fixture = fixture();
        when(fixture.persistence().complete(any(), any(), any())).thenAnswer(call -> {
            fixture.current().set(with(fixture.job(), JobStatus.CANCELLED, null));
            return false;
        });
        worker(fixture).execute(fixture.job().jobRef());
        assertThat(finalObjects()).isEmpty();
        assertThat(Files.exists(temporary.resolve(fixture.job().originalObjectKey()))).isFalse();
        verify(fixture.persistence(), never()).fail(any(), any(), any());
    }

    @ParameterizedTest
    @EnumSource(value = JobStatus.class, names = {"READY", "RESULT_EXPIRED"})
    void lostCommitUsesBothReferencesEvenAfterAckWithoutSecondRender(JobStatus state) throws Exception {
        var fixture = fixture();
        when(fixture.persistence().complete(any(), any(), any())).thenAnswer(call -> {
            fixture.current().set(with(fixture.job(), state, call.getArgument(1)));
            throw new IllegalStateException("synthetic private ack lost");
        });
        var worker = worker(fixture);
        worker.execute(fixture.job().jobRef());
        worker.execute(fixture.job().jobRef());
        assertThat(finalObjects()).hasSize(2);
        verify(fixture.renderer(), times(1)).render(any(), any());
        verify(fixture.persistence(), never()).fail(any(), any(), any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"render", "image-upload", "manifest-upload", "commit", "output-hash", "manifest-binding"})
    void failureDiscardsOwnedOutputsAndNeverProducesReady(String fault) throws Exception {
        var fixture = fixture();
        if (fault.equals("render")) doThrow(new IllegalStateException("private content")).when(fixture.renderer()).render(any(), any());
        if (fault.equals("image-upload") || fault.equals("manifest-upload")) doAnswer(call -> {
            String key = call.getArgument(0);
            Path path = call.getArgument(1);
            fixture.delegate().store(key, path, call.getArgument(2), call.getArgument(3), call.getArgument(4));
            if (key.endsWith(fault.equals("image-upload") ? ".webp" : ".json")) throw new IllegalStateException("upload ack lost");
            return null;
        }).when(fixture.storage()).store(any(), any(), any(), any(), any());
        if (fault.equals("commit")) when(fixture.persistence().complete(any(), any(), any())).thenThrow(new IllegalStateException("rollback"));
        if (fault.equals("output-hash")) doAnswer(call -> {
            RenderRequest request = call.getArgument(1);
            var path = outputFile();
            return new RenderPort.Output(path, RenderManifest.create(request,
                new RenderedImage("image/webp", Files.size(path), 2, 2, "0".repeat(64)), List.of()));
        }).when(fixture.renderer()).render(any(), any());
        if (fault.equals("manifest-binding")) doAnswer(call -> {
            var path = outputFile();
            return new RenderPort.Output(path, RenderManifest.create(otherRequest(),
                new RenderedImage("image/webp", Files.size(path), 2, 2, hash(Files.readAllBytes(path))), List.of()));
        }).when(fixture.renderer()).render(any(), any());
        worker(fixture).execute(fixture.job().jobRef());
        assertThat(finalObjects()).isEmpty();
        assertThat(renderFiles()).isEmpty();
        verify(fixture.persistence()).fail(fixture.job().id(), GatewayErrorCode.INTERNAL_ERROR, NOW);
    }

    @Test
    void databaseUnavailableAfterCommitRetainsUncertainRemoteObjects() throws Exception {
        var fixture = fixture();
        when(fixture.persistence().complete(any(), any(), any())).thenAnswer(call -> {
            when(fixture.persistence().find(any())).thenThrow(new IllegalStateException("db unavailable"));
            throw new IllegalStateException("commit outcome unknown");
        });
        worker(fixture).execute(fixture.job().jobRef());
        assertThat(finalObjects()).hasSize(2);
        assertThat(Files.exists(temporary.resolve(fixture.job().originalObjectKey()))).isTrue();
        assertThat(renderFiles()).isEmpty();
        verify(fixture.persistence(), never()).fail(any(), any(), any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"lock", "read-after-lock"})
    void unresolvedFailureResolutionRetainsBothUploadsAndOriginal(String boundary) throws Exception {
        var fixture = fixture();
        when(fixture.persistence().complete(any(), any(), any())).thenThrow(new IllegalStateException("unknown commit"));
        doAnswer(call -> {
            if (boundary.equals("lock")) throw new IllegalStateException("unknown resolution");
            when(fixture.persistence().find(any())).thenThrow(new IllegalStateException("unknown read after resolution"));
            return null;
        }).when(fixture.persistence()).fail(any(), any(), any());
        worker(fixture).execute(fixture.job().jobRef());
        assertThat(finalObjects()).hasSize(2);
        assertThat(Files.exists(temporary.resolve(fixture.job().originalObjectKey()))).isTrue();
        assertThat(renderFiles()).isEmpty();
        verify(fixture.persistence(), times(1)).fail(fixture.job().id(), GatewayErrorCode.INTERNAL_ERROR, NOW);
        verify(fixture.renderer(), times(1)).render(any(), any());
        verify(fixture.storage(), never()).delete(any());
    }

    @Test
    void outsideDirectoryOutputIsNotUploadedOrDeleted() throws Exception {
        var fixture = fixture();
        doAnswer(call -> {
            RenderRequest request = call.getArgument(1);
            return new RenderPort.Output(fixture.reusable(), RenderManifest.create(request,
                new RenderedImage("image/webp", 32, 2, 2, "0".repeat(64)), List.of()));
        }).when(fixture.renderer()).render(any(), any());
        worker(fixture).execute(fixture.job().jobRef());
        assertThat(Files.exists(fixture.reusable())).isTrue();
        assertThat(finalObjects()).isEmpty();
        verify(fixture.persistence()).fail(fixture.job().id(), GatewayErrorCode.INTERNAL_ERROR, NOW);
    }

    @Test
    void failedDeletionDoesNotSkipOtherOwnedObjectOrLocalCleanup() throws Exception {
        var fixture = fixture();
        when(fixture.persistence().complete(any(), any(), any())).thenReturn(false);
        doThrow(new IllegalStateException("delete failed")).when(fixture.storage()).delete(any());
        worker(fixture).execute(fixture.job().jobRef());
        verify(fixture.storage(), times(2)).delete(any());
        assertThat(renderFiles()).isEmpty();
    }

    @ParameterizedTest @ValueSource(ints = {10, 30})
    void bothUploadsKeepOneDeadlineAndExpiredPairNeverCommits(int delayPerUpload) throws Exception {
        var fixture = fixture();
        var job = fixture.job();
        fixture.current().set(new RenderingJobRepository.WorkItem(job.id(), job.jobRef(), job.status(), job.originalObjectKey(),
            job.source(), job.sourceLanguage(), job.targetLanguage(), job.createdAt(), job.ocrObjectKey(), job.ocrSha256(),
            job.translationObjectKey(), job.translationSha256(), null, 60));
        var time = new AtomicReference<>(NOW);
        var clock = mock(Clock.class);
        when(clock.instant()).thenAnswer(call -> time.get());
        doAnswer(call -> {
            assertThat(com.toonlira.translationgateway.domain.rendering.ResultObjectKey.expiry(call.getArgument(0)))
                .contains(NOW.plusSeconds(60));
            call.callRealMethod();
            time.set(time.get().plusSeconds(delayPerUpload));
            return null;
        }).when(fixture.storage()).store(any(), any(), any(), any(), any());
        when(fixture.persistence().complete(any(), any(), any())).thenReturn(true);
        ObjectProvider<RenderPort> provider = mock(ObjectProvider.class);
        when(provider.getObject()).thenReturn(fixture.renderer());
        worker(fixture.persistence(), fixture.storage(), provider, fixture.properties(), clock).execute(job.jobRef());
        verify(fixture.renderer(), times(1)).render(any(), any());
        if (delayPerUpload == 30) {
            verify(fixture.persistence(), never()).complete(any(), any(), any());
            assertThat(finalObjects()).isEmpty();
            verify(fixture.persistence()).fail(job.id(), GatewayErrorCode.INTERNAL_ERROR, NOW.plusSeconds(60));
        } else {
            verify(fixture.persistence()).complete(eq(job.id()), any(), eq(NOW.plusSeconds(20)));
            assertThat(finalObjects()).hasSize(2);
        }
        assertThat(Files.exists(fixture.reusable())).isTrue();
        assertThat(renderFiles()).isEmpty();
    }

    private Fixture fixture() throws Exception {
        var properties = new GatewayProperties();
        properties.getStorage().setLocalDirectory(temporary);
        Files.createDirectory(temporary.resolve("work"));
        properties.getRendering().setMode(GatewayProperties.Rendering.Mode.LOCAL);
        properties.getRendering().setTemporaryDirectory(temporary.resolve("work").toRealPath());
        var delegate = new LegacyStorageFixture(properties);
        var storage = spy(delegate);
        var persistence = mock(RenderingPersistenceUseCase.class);
        var renderer = mock(RenderPort.class);
        UUID id = UUID.randomUUID(), ref = UUID.randomUUID();
        var original = Files.createTempFile(temporary, "reusable-", ".png");
        var image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        ImageIO.write(image, "png", original.toFile());
        var source = new RenderSource("image/png", Files.size(original), 2, 2, hash(Files.readAllBytes(original)));
        var ocr = new OcrManifestService(MAPPER).encode(new OcrManifest("1.0", ref, "en", 2, 2, List.of()));
        var result = new TranslationValidator(Set.of(new LanguagePair("en", "pt-BR"))).validateResponse(
            new TranslationRequest(ref, new LanguagePair("en", "pt-BR"), List.of()), new TranslationResponse(List.of()));
        var translated = new TranslationManifestService(MAPPER).encode(result, ocr.sha256());
        var ocrFile = Files.createTempFile(temporary, "fixture-", ".json");
        Files.write(ocrFile, ocr.bytes());
        var translatedFile = Files.createTempFile(temporary, "fixture-", ".json");
        Files.write(translatedFile, translated.bytes());
        delegate.store("private/original", original, "image/png", source.sha256(), NOW);
        delegate.store("private/ocr", ocrFile, "application/json", ocr.sha256(), NOW);
        delegate.store("private/translated", translatedFile, "application/json", translated.sha256(), NOW);
        var job = new RenderingJobRepository.WorkItem(id, ref, JobStatus.RENDERING, "private/original", source,
            "en", "pt-BR", NOW.minusSeconds(1), "private/ocr", ocr.sha256(), "private/translated", translated.sha256(), null);
        var current = new AtomicReference<>(job);
        when(persistence.find(ref)).thenAnswer(call -> current.get());
        when(persistence.claim(eq(ref), any())).thenReturn(RenderingJobRepository.Claim.STARTED);
        when(renderer.render(any(), any())).thenAnswer(call -> {
            RenderRequest request = call.getArgument(1);
            var output = outputFile();
            return new RenderPort.Output(output, RenderManifest.create(request,
                new RenderedImage("image/webp", Files.size(output), 2, 2, hash(Files.readAllBytes(output))), List.of()));
        });
        return new Fixture(job, current, persistence, storage, delegate, renderer, properties, original);
    }

    // Header-only stand-in validates orchestration, not codec or image quality. Native integration tests use a real WebP.
    private Path outputFile() throws Exception {
        var path = Files.createTempFile(temporary.resolve("work").toRealPath(), "render-", ".webp");
        var bytes = new byte[32];
        System.arraycopy("RIFF".getBytes(StandardCharsets.US_ASCII), 0, bytes, 0, 4);
        bytes[4] = 24;
        System.arraycopy("WEBPVP8X".getBytes(StandardCharsets.US_ASCII), 0, bytes, 8, 8);
        bytes[16] = 10;
        bytes[24] = 1;
        bytes[27] = 1;
        Files.write(path, bytes);
        return path;
    }

    private static RenderRequest otherRequest() {
        UUID ref = UUID.randomUUID();
        var pair = new LanguagePair("en", "pt-BR");
        var result = new TranslationValidator(Set.of(pair)).validateResponse(new TranslationRequest(ref, pair, List.of()), new TranslationResponse(List.of()));
        return RenderRequest.create(new RenderSource("image/png", 24, 2, 2, "0".repeat(64)),
            new OcrManifest("1.0", ref, "en", 2, 2, List.of()), result, "1".repeat(64), "2".repeat(64), RenderPolicy.initial());
    }

    private static RenderingJobRepository.WorkItem with(RenderingJobRepository.WorkItem job, JobStatus status, RenderingJobRepository.Artifacts artifacts) {
        return new RenderingJobRepository.WorkItem(job.id(), job.jobRef(), status, job.originalObjectKey(), job.source(), job.sourceLanguage(), job.targetLanguage(),
            job.createdAt(), job.ocrObjectKey(), job.ocrSha256(), job.translationObjectKey(), job.translationSha256(), artifacts, job.resultRetentionSeconds());
    }

    private static RenderingJobRepository.WorkItem copy(RenderingJobRepository.WorkItem job, RenderSource source, String from, String to, Instant createdAt, UUID ref) {
        return new RenderingJobRepository.WorkItem(job.id(), ref, job.status(), job.originalObjectKey(), source, from, to, createdAt,
            job.ocrObjectKey(), job.ocrSha256(), job.translationObjectKey(), job.translationSha256(), null, job.resultRetentionSeconds());
    }

    private ProcessRenderingTaskUseCase worker(Fixture fixture) {
        ObjectProvider<RenderPort> provider = mock(ObjectProvider.class);
        when(provider.getObject()).thenReturn(fixture.renderer());
        return worker(fixture.persistence(), fixture.storage(), provider, fixture.properties());
    }

    private ProcessRenderingTaskUseCase worker(RenderingPersistenceUseCase persistence, ObjectStoragePort storage,
                                              ObjectProvider<RenderPort> renderer, GatewayProperties properties) {
        return worker(persistence, storage, renderer, properties, Clock.fixed(NOW, ZoneOffset.UTC));
    }

    private ProcessRenderingTaskUseCase worker(RenderingPersistenceUseCase persistence, ObjectStoragePort storage,
                                              ObjectProvider<RenderPort> renderer, GatewayProperties properties, Clock clock) {
        return worker(persistence, storage, renderer, properties, clock, new MediaInspectionService());
    }

    private ProcessRenderingTaskUseCase worker(RenderingPersistenceUseCase persistence, ObjectStoragePort storage,
                                              ObjectProvider<RenderPort> renderer, GatewayProperties properties, Clock clock,
                                              MediaInspectionService inspector) {
        when(persistence.originalAvailable(any(), any())).thenReturn(true);
        return new ProcessRenderingTaskUseCase(persistence, storage, inspector,
            new OcrManifestService(MAPPER), new TranslationManifestService(MAPPER), new RenderManifestService(MAPPER),
            renderer, properties, clock, lifecycle);
    }

    private List<Path> finalObjects() throws Exception {
        var root = temporary.resolve("private/rendering");
        if (!Files.exists(root)) return List.of();
        try (var paths = Files.walk(root)) { return paths.filter(Files::isRegularFile).toList(); }
    }

    private List<Path> renderFiles() throws Exception {
        try (var paths = Files.list(temporary.resolve("work"))) { return paths.filter(Files::isRegularFile).toList(); }
    }

    private static String hash(byte[] bytes) throws Exception { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)); }
    private record Fixture(RenderingJobRepository.WorkItem job, AtomicReference<RenderingJobRepository.WorkItem> current,
                           RenderingPersistenceUseCase persistence, LocalObjectStorageAdapter storage, LocalObjectStorageAdapter delegate,
                           RenderPort renderer, GatewayProperties properties, Path reusable) { }
}
