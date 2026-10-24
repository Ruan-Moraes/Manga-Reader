package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.doAnswer;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.TranslationJobRepository;
import com.toonlira.translationgateway.application.port.TranslationPort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.infrastructure.storage.LocalObjectStorageAdapter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;

class ProcessTranslationTaskUseCaseTest {
    private static final Instant NOW = Instant.parse("2026-10-02T12:00:00Z");
    @TempDir Path temporary;
    private final CleanupLifecycleObjectsUseCase lifecycle = mock(CleanupLifecycleObjectsUseCase.class);

    @Test
    void expiredOriginalPreventsTranslationReservationAndProviderCall() throws Exception {
        var fixture = fixture(List.of(region(0, "synthetic source")));
        var provider = mock(TranslationPort.class);
        var useCase = worker(fixture.persistence(), provider, fixture.properties());
        when(fixture.persistence().originalAvailable(any(), any())).thenReturn(false);
        useCase.execute(fixture.job().jobRef());
        verify(provider, never()).translate(any());
        verify(fixture.persistence(), never()).claim(any(), any());
        assertThat(Files.exists(temporary.resolve("private/translation"))).isFalse();
    }

    @Test
    void expiryDuringTranslationDiscardsResponseWithoutSecondCall() throws Exception {
        var fixture = fixture(List.of(region(0, "synthetic source")));
        var provider = mock(TranslationPort.class);
        when(fixture.persistence().claim(eq(fixture.job().jobRef()), any())).thenReturn(TranslationJobRepository.Claim.STARTED);
        var useCase = worker(fixture.persistence(), provider, fixture.properties());
        when(provider.translate(any())).thenAnswer(call -> {
            TranslationRequest request = call.getArgument(0);
            when(fixture.persistence().originalAvailable(any(), any())).thenReturn(false);
            return new TranslationResponse(List.of(new TranslationResponse.Region(request.regions().getFirst().id(), "resposta sintética")));
        });
        useCase.execute(fixture.job().jobRef());
        verify(provider, times(1)).translate(any());
        verify(fixture.persistence(), never()).complete(any(), any(), any(), any());
        assertThat(Files.exists(temporary.resolve("private/translation"))).isFalse();
    }

    @Test
    void disabledModeDoesNotReadAJobOrCallProvider() {
        var persistence = mock(TranslationPersistenceUseCase.class);
        var provider = mock(TranslationPort.class);
        var properties = properties();
        properties.getTranslation().setMode(GatewayProperties.Translation.Mode.DISABLED);
        worker(persistence, provider, properties).execute(UUID.randomUUID());
        verify(persistence, never()).find(any());
        verify(provider, never()).translate(any());
        verifyNoInteractions(lifecycle);
    }

    @Test
    void sendsOneWholePageAndStoresOnlyTheTranslatedManifest() throws Exception {
        var fixture = fixture(List.of(region(0, "Hello"), region(1, "world")));
        var provider = mock(TranslationPort.class);
        when(provider.translate(any())).thenAnswer(call -> {
            TranslationRequest request = call.getArgument(0);
            assertThat(request.regions()).extracting(TranslationRequest.Region::sourceText)
                .containsExactly("Hello", "world");
            return new TranslationResponse(List.of(
                new TranslationResponse.Region(request.regions().get(1).id(), "mundo"),
                new TranslationResponse.Region(request.regions().get(0).id(), "Olá")));
        });
        when(fixture.persistence().claim(eq(fixture.job().jobRef()), any()))
            .thenReturn(TranslationJobRepository.Claim.STARTED);
        when(fixture.persistence().complete(eq(fixture.job().id()), any(), any(), any())).thenReturn(true);

        worker(fixture.persistence(), provider, fixture.properties()).execute(fixture.job().jobRef());

        verify(provider, times(1)).translate(any());
        verify(fixture.persistence()).complete(eq(fixture.job().id()), any(), any(), eq(NOW));
        verify(lifecycle).executeForJob(fixture.job().id());
        try (var paths = Files.walk(temporary.resolve("private/translation"))) {
            var files = paths.filter(Files::isRegularFile).toList();
            assertThat(files).hasSize(1);
            var json = Files.readString(files.getFirst());
            assertThat(json).contains("Olá", "mundo", "ocrManifestSha256")
                .doesNotContain("Hello", "world");
            assertThat(json.indexOf("Olá")).isLessThan(json.indexOf("mundo"));
        }
    }

    @Test
    void emptyPageWritesEmptyManifestWithoutProvider() throws Exception {
        var fixture = fixture(List.of());
        when(fixture.persistence().claim(eq(fixture.job().jobRef()), any()))
            .thenReturn(TranslationJobRepository.Claim.STARTED);
        when(fixture.persistence().complete(eq(fixture.job().id()), any(), any(), any())).thenReturn(true);
        var provider = mock(TranslationPort.class);

        worker(fixture.persistence(), provider, fixture.properties()).execute(fixture.job().jobRef());

        verify(provider, never()).translate(any());
        verify(fixture.persistence()).complete(eq(fixture.job().id()), any(), any(), eq(NOW));
    }

    @Test
    void tamperedOcrManifestFailsBeforeReservation() throws Exception {
        var fixture = fixture(List.of(region(0, "source")));
        Files.writeString(temporary.resolve(fixture.job().ocrObjectKey()), "tampered");
        var provider = mock(TranslationPort.class);

        worker(fixture.persistence(), provider, fixture.properties()).execute(fixture.job().jobRef());

        verify(fixture.persistence()).failUnclaimed(fixture.job().id(), GatewayErrorCode.TRANSLATION_INVALID_REQUEST, NOW);
        verify(lifecycle).executeForJob(fixture.job().id());
        verify(fixture.persistence(), never()).claim(any(), any());
        verify(provider, never()).translate(any());
    }

    @Test
    void removedPairFailsBeforeStorageReservationOrProvider() throws Exception {
        var fixture = fixture(List.of(region(0, "source")));
        fixture.properties().getTranslation().setEnabledPairs(List.of("ja:pt-BR"));
        Files.delete(temporary.resolve(fixture.job().ocrObjectKey()));
        var provider = mock(TranslationPort.class);

        worker(fixture.persistence(), provider, fixture.properties()).execute(fixture.job().jobRef());

        verify(fixture.persistence()).failUnclaimed(fixture.job().id(), GatewayErrorCode.TRANSLATION_INVALID_REQUEST, NOW);
        verify(fixture.persistence(), never()).claim(any(), any());
        verify(provider, never()).translate(any());
    }

    @Test
    void rejectedOutputNeverAdvancesJobAndIsNotRetried() throws Exception {
        var fixture = fixture(List.of(region(0, "source")));
        var provider = mock(TranslationPort.class);
        when(fixture.persistence().claim(eq(fixture.job().jobRef()), any()))
            .thenReturn(TranslationJobRepository.Claim.STARTED, TranslationJobRepository.Claim.ALREADY_HANDLED);
        when(provider.translate(any())).thenReturn(new TranslationResponse(List.of()));

        var worker = worker(fixture.persistence(), provider, fixture.properties());
        worker.execute(fixture.job().jobRef());
        worker.execute(fixture.job().jobRef());

        verify(provider, times(1)).translate(any());
        verify(fixture.persistence()).fail(fixture.job().id(), GatewayErrorCode.TRANSLATION_INVALID_RESPONSE, NOW);
        verify(fixture.persistence(), never()).complete(any(), any(), any(), any());
    }

    @Test
    void cancellationAfterProviderDiscardsUncommittedArtifact() throws Exception {
        var fixture = fixture(List.of(region(0, "source")));
        var provider = mock(TranslationPort.class);
        when(provider.translate(any())).thenAnswer(call -> {
            TranslationRequest request = call.getArgument(0);
            return new TranslationResponse(List.of(new TranslationResponse.Region(request.regions().getFirst().id(), "alvo")));
        });
        when(fixture.persistence().claim(eq(fixture.job().jobRef()), any()))
            .thenReturn(TranslationJobRepository.Claim.STARTED);
        when(fixture.persistence().complete(eq(fixture.job().id()), any(), any(), any())).thenReturn(false);

        worker(fixture.persistence(), provider, fixture.properties()).execute(fixture.job().jobRef());

        try (var paths = Files.walk(temporary.resolve("private/translation"))) {
            assertThat(paths.filter(Files::isRegularFile)).isEmpty();
        }
        verify(fixture.persistence(), never()).fail(any(), any(), any());
    }

    @ParameterizedTest
    @EnumSource(value = JobStatus.class, names = {"RENDERING", "READY", "CANCEL_PENDING"})
    void lostCommitAcknowledgementKeepsReferencedArtifactWithoutSecondCall(JobStatus currentStatus) throws Exception {
        var fixture = fixture(List.of(region(0, "source")));
        var provider = translatingProvider();
        var committed = new AtomicReference<TranslationJobRepository.WorkItem>();
        when(fixture.persistence().claim(eq(fixture.job().jobRef()), any()))
            .thenReturn(TranslationJobRepository.Claim.STARTED);
        when(fixture.persistence().complete(eq(fixture.job().id()), any(), any(), any())).thenAnswer(call -> {
            committed.set(new TranslationJobRepository.WorkItem(fixture.job().id(), fixture.job().jobRef(),
                currentStatus, "en", "pt-BR", fixture.job().ocrObjectKey(), fixture.job().ocrSha256(),
                call.getArgument(1), call.getArgument(2)));
            throw new IllegalStateException("ack lost");
        });
        when(fixture.persistence().find(fixture.job().jobRef()))
            .thenAnswer(call -> committed.get() == null ? fixture.job() : committed.get());

        var worker = worker(fixture.persistence(), provider, fixture.properties());
        worker.execute(fixture.job().jobRef());
        worker.execute(fixture.job().jobRef());

        try (var paths = Files.walk(temporary.resolve("private/translation"))) {
            assertThat(paths.filter(Files::isRegularFile).count()).isOne();
        }
        verify(provider, times(1)).translate(any());
        verify(fixture.persistence(), never()).fail(any(), any(), any());
    }

    @Test
    void failedCommitRemovesOrphanAndFailsWithoutRepeatingProvider() throws Exception {
        var fixture = fixture(List.of(region(0, "source")));
        var provider = translatingProvider();
        when(fixture.persistence().claim(eq(fixture.job().jobRef()), any()))
            .thenReturn(TranslationJobRepository.Claim.STARTED);
        when(fixture.persistence().complete(eq(fixture.job().id()), any(), any(), any()))
            .thenThrow(new IllegalStateException("commit failed"));

        worker(fixture.persistence(), provider, fixture.properties()).execute(fixture.job().jobRef());

        try (var paths = Files.walk(temporary.resolve("private/translation"))) {
            assertThat(paths.filter(Files::isRegularFile).count()).isZero();
        }
        verify(provider, times(1)).translate(any());
        verify(fixture.persistence()).fail(fixture.job().id(), GatewayErrorCode.TRANSLATION_UNAVAILABLE, NOW);
    }

    private TranslationPort translatingProvider() {
        var provider = mock(TranslationPort.class);
        when(provider.translate(any())).thenAnswer(call -> {
            TranslationRequest request = call.getArgument(0);
            return new TranslationResponse(List.of(new TranslationResponse.Region(request.regions().getFirst().id(), "alvo")));
        });
        return provider;
    }

    @ParameterizedTest
    @ValueSource(strings = {"lock", "read-after-lock"})
    void unresolvedFailureResolutionRetainsTranslationArtifact(String boundary) throws Exception {
        var fixture = fixture(List.of(region(0, "source")));
        var provider = translatingProvider();
        when(fixture.persistence().claim(eq(fixture.job().jobRef()), any())).thenReturn(TranslationJobRepository.Claim.STARTED);
        when(fixture.persistence().complete(any(), any(), any(), any())).thenThrow(new IllegalStateException("unknown commit"));
        doAnswer(call -> {
            if (boundary.equals("lock")) throw new IllegalStateException("unknown resolution");
            when(fixture.persistence().find(any())).thenThrow(new IllegalStateException("unknown read after resolution"));
            return null;
        }).when(fixture.persistence()).fail(any(), any(), any());
        worker(fixture.persistence(), provider, fixture.properties()).execute(fixture.job().jobRef());
        try (var paths = Files.walk(temporary.resolve("private/translation"))) {
            assertThat(paths.filter(Files::isRegularFile).count()).isOne();
        }
        assertThat(Files.exists(temporary.resolve(fixture.job().ocrObjectKey()))).isTrue();
        verify(fixture.persistence(), times(1)).fail(fixture.job().id(), GatewayErrorCode.TRANSLATION_UNAVAILABLE, NOW);
        verify(provider, times(1)).translate(any());
    }

    private Fixture fixture(List<OcrManifest.Region> regions) throws Exception {
        var properties = properties();
        var jobId = UUID.randomUUID();
        var jobRef = UUID.randomUUID();
        var manifest = new OcrManifest("1.0", jobRef, "en", 100, 100, regions);
        var encoded = new OcrManifestService(GatewayJsonMapper.create()).encode(manifest);
        var source = Files.createTempFile(temporary, "ocr-source-", ".json");
        Files.write(source, encoded.bytes());
        var key = "private/ocr/fixture.json";
        new LocalObjectStorageAdapter(properties).store(key, source, "application/json", encoded.sha256(), NOW);
        var job = new TranslationJobRepository.WorkItem(jobId, jobRef, JobStatus.TRANSLATING,
            "en", "pt-BR", key, encoded.sha256(), null, null);
        var persistence = mock(TranslationPersistenceUseCase.class);
        when(persistence.find(jobRef)).thenReturn(job);
        return new Fixture(job, persistence, properties);
    }

    private ProcessTranslationTaskUseCase worker(TranslationPersistenceUseCase persistence, TranslationPort provider,
                                                  GatewayProperties properties) {
        when(persistence.originalAvailable(any(), any())).thenReturn(true);
        var mapper = GatewayJsonMapper.create();
        return new ProcessTranslationTaskUseCase(persistence, new LocalObjectStorageAdapter(properties),
            new OcrManifestService(mapper), new TranslationManifestService(mapper), provider,
            properties, Clock.fixed(NOW, ZoneOffset.UTC), lifecycle);
    }

    private GatewayProperties properties() {
        var properties = new GatewayProperties();
        properties.getStorage().setLocalDirectory(temporary);
        properties.getTranslation().setMode(GatewayProperties.Translation.Mode.GOOGLE);
        properties.getTranslation().setEnabledPairs(List.of("en:pt-BR"));
        return properties;
    }

    private static OcrManifest.Region region(int order, String text) {
        return new OcrManifest.Region(UUID.randomUUID(), order, text, List.of(
            new OcrManifest.Vertex(0, 0), new OcrManifest.Vertex(1, 0),
            new OcrManifest.Vertex(1, 1), new OcrManifest.Vertex(0, 1)));
    }

    private record Fixture(TranslationJobRepository.WorkItem job, TranslationPersistenceUseCase persistence,
                           GatewayProperties properties) { }
}
