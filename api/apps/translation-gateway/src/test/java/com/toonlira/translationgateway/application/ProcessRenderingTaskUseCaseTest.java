package com.toonlira.translationgateway.application;

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

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.application.port.RenderPort;
import com.toonlira.translationgateway.application.port.RenderingJobRepository;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.OcrManifest;
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
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.UUID;
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
        var delegate = new LocalObjectStorageAdapter(properties);
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
        when(persistence.originalAvailable(any(), any())).thenReturn(true);
        return new ProcessRenderingTaskUseCase(persistence, storage, new MediaInspectionService(),
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
