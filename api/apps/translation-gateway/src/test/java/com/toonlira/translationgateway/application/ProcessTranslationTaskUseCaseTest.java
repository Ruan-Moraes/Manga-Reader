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
import com.toonlira.translationgateway.application.port.TranslationRefinerPort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.ocr.Lexicon;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.infrastructure.storage.LocalObjectStorageAdapter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
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
    void refinedTranslationReplacesTheMachineOneInTheManifest() throws Exception {
        var fixture = fixture(List.of(region(0, "WINDOWS 15 50 PATHETIC")));
        when(fixture.persistence().claim(eq(fixture.job().jobRef()), any())).thenReturn(TranslationJobRepository.Claim.STARTED);
        when(fixture.persistence().complete(eq(fixture.job().id()), any(), any(), any())).thenReturn(true);
        TranslationRefinerPort refiner = (request, translated) -> new TranslationResponse(List.of(
            new TranslationResponse.Region(translated.regions().getFirst().id(), "O WINDOWS É TÃO PATÉTICO")));

        worker(fixture.persistence(), translatingProvider(), refiner, fixture.properties()).execute(fixture.job().jobRef());

        assertThat(writtenManifest()).contains("O WINDOWS É TÃO PATÉTICO").doesNotContain("alvo");
        verify(fixture.persistence()).complete(eq(fixture.job().id()), any(), any(), eq(NOW));
    }

    @Test
    void aChapterPageSendsItsGlossaryToTheReviewAndLearnsTheNamesTheReviewUsed() throws Exception {
        var fixture = fixture(List.of(region(0, "source")));
        var chapter = new TranslationJobRepository.WorkItem(fixture.job().id(), fixture.job().jobRef(), JobStatus.TRANSLATING,
            "en", "pt-BR", fixture.job().ocrObjectKey(), fixture.job().ocrSha256(), null, null, UUID.randomUUID(), UUID.randomUUID());
        when(fixture.persistence().find(chapter.jobRef())).thenReturn(chapter);
        when(fixture.persistence().claim(eq(chapter.jobRef()), any())).thenReturn(TranslationJobRepository.Claim.STARTED);
        when(fixture.persistence().complete(eq(chapter.id()), any(), any(), any())).thenReturn(true);
        var memory = mock(com.toonlira.translationgateway.application.port.ChapterMemoryRepository.class);
        when(memory.find(any(), any(), any(), any())).thenReturn(java.util.Map.of("Basil", "Manjericão"));
        var glossaries = new ArrayList<java.util.Map<String, String>>();
        var refiner = new TranslationRefinerPort() {
            @Override public TranslationResponse refine(TranslationRequest request, TranslationResponse translated) { return translated; }
            @Override public Review refine(TranslationRequest request, TranslationResponse translated, java.util.Map<String, String> glossary) {
                glossaries.add(glossary);
                return new Review(new TranslationResponse(List.of(
                    new TranslationResponse.Region(translated.regions().getFirst().id(), "revisado"))), java.util.Map.of("Mint", "Menta"));
            }
        };
        when(fixture.persistence().originalAvailable(any(), any())).thenReturn(true);
        var mapper = GatewayJsonMapper.create();
        new ProcessTranslationTaskUseCase(fixture.persistence(), new LocalObjectStorageAdapter(fixture.properties()),
            new OcrManifestService(mapper), new TranslationManifestService(mapper), translatingProvider(), refiner,
            fixture.properties(), Clock.fixed(NOW, ZoneOffset.UTC), lifecycle, memory, language -> Lexicon.NONE)
            .execute(chapter.jobRef());

        assertThat(writtenManifest()).contains("revisado");
        // The result hands back only the names this page used: the review's "Mint", not the chapter's "Basil",
        // which the page does not contain.
        assertThat(writtenManifest()).contains("\"terms\":[{\"source\":\"Mint\",\"target\":\"Menta\"}]").doesNotContain("Basil");
        assertThat(glossaries).containsExactly(java.util.Map.of("Basil", "Manjericão"));
        verify(memory).remember(eq(chapter.installationId()), eq(chapter.contextRef()), any(), eq(java.util.Map.of("Mint", "Menta")),
            any(), eq(NOW), eq(NOW.plusSeconds(fixture.properties().getDisclosure().getResultRetentionSeconds())));
    }

    @Test
    void refinerFailureKeepsTheMachineTranslationAndCompletesTheJob() throws Exception {
        var fixture = fixture(List.of(region(0, "source")));
        when(fixture.persistence().claim(eq(fixture.job().jobRef()), any())).thenReturn(TranslationJobRepository.Claim.STARTED);
        when(fixture.persistence().complete(eq(fixture.job().id()), any(), any(), any())).thenReturn(true);
        TranslationRefinerPort refiner = (request, translated) -> { throw new IllegalStateException("deadline exceeded"); };

        worker(fixture.persistence(), translatingProvider(), refiner, fixture.properties()).execute(fixture.job().jobRef());

        assertThat(writtenManifest()).contains("alvo");
        verify(fixture.persistence()).complete(eq(fixture.job().id()), any(), any(), eq(NOW));
        verify(fixture.persistence(), never()).fail(any(), any(), any());
    }

    @Test
    void refinerReplyForOtherRegionsIsDiscarded() throws Exception {
        var fixture = fixture(List.of(region(0, "source")));
        when(fixture.persistence().claim(eq(fixture.job().jobRef()), any())).thenReturn(TranslationJobRepository.Claim.STARTED);
        when(fixture.persistence().complete(eq(fixture.job().id()), any(), any(), any())).thenReturn(true);
        TranslationRefinerPort refiner = (request, translated) -> new TranslationResponse(List.of(
            new TranslationResponse.Region(UUID.randomUUID(), "outra região")));

        worker(fixture.persistence(), translatingProvider(), refiner, fixture.properties()).execute(fixture.job().jobRef());

        assertThat(writtenManifest()).contains("alvo").doesNotContain("outra região");
    }

    @Test
    void joinedFragmentsAreReviewedAsOneSegmentBeforeTheirFollowersExist() throws Exception {
        var fixture = fixture(List.of(region(0, "あ"), region(1, "ら")), "ja");
        when(fixture.persistence().claim(eq(fixture.job().jobRef()), any())).thenReturn(TranslationJobRepository.Claim.STARTED);
        when(fixture.persistence().complete(eq(fixture.job().id()), any(), any(), any())).thenReturn(true);
        var reviewed = new java.util.ArrayList<String>();
        TranslationRefinerPort refiner = (request, translated) -> {
            request.regions().forEach(region -> reviewed.add(region.sourceText()));
            return new TranslationResponse(List.of(new TranslationResponse.Region(translated.regions().getFirst().id(), "Nossa")));
        };

        worker(fixture.persistence(), translatingProvider(), refiner, fixture.properties()).execute(fixture.job().jobRef());

        assertThat(reviewed).containsExactly("あら");
        assertThat(writtenManifest()).contains("Nossa", "…");
    }

    private String writtenManifest() throws Exception {
        try (var paths = Files.walk(temporary.resolve("private/translation"))) {
            var files = paths.filter(Files::isRegularFile).toList();
            assertThat(files).hasSize(1);
            return Files.readString(files.getFirst());
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

    @ParameterizedTest
    @ValueSource(strings = {"matching", "foreign", "tampered", "absent"})
    void theReviewLearnsEachRegionsKindOnlyFromThisPagesLayout(String layout) throws Exception {
        var balloon = region(0, "Hello");
        var drawn = region(1, "WHAT");
        var fixture = fixture(List.of(balloon, drawn));
        var image = "c".repeat(64);
        var json = """
            {"imageSha256":"%s","ocrManifestSha256":"%s","bubbles":[],
             "regionKinds":[{"regionId":"%s","kind":"text_bubble"},{"regionId":"%s","kind":"unknown"}]}"""
            .formatted(image, layout.equals("foreign") ? "d".repeat(64) : fixture.job().ocrSha256(), balloon.id(), drawn.id());
        var file = Files.createTempFile(temporary, "layout-", ".json");
        Files.writeString(file, json);
        var hash = java.util.HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(file)));
        var key = "private/layout/fixture.json";
        new LocalObjectStorageAdapter(fixture.properties()).store(key, file, "application/json", hash, NOW);
        if (layout.equals("tampered")) Files.writeString(temporary.resolve(key), json.replace("unknown", "text_free"));
        var job = fixture.job();
        var withLayout = new TranslationJobRepository.WorkItem(job.id(), job.jobRef(), job.status(), job.sourceLanguage(),
            job.targetLanguage(), job.ocrObjectKey(), job.ocrSha256(), null, null, null, null, image,
            layout.equals("absent") ? null : key, layout.equals("absent") ? null : hash);
        when(fixture.persistence().find(job.jobRef())).thenReturn(withLayout);
        when(fixture.persistence().claim(eq(job.jobRef()), any())).thenReturn(TranslationJobRepository.Claim.STARTED);
        when(fixture.persistence().complete(eq(job.id()), any(), any(), any())).thenReturn(true);
        var seen = new java.util.ArrayList<String>();
        TranslationRefinerPort refiner = (request, translated) -> {
            request.regions().forEach(region -> seen.add(region.kind()));
            return translated;
        };

        var provider = mock(TranslationPort.class);
        when(provider.translate(any())).thenAnswer(call -> new TranslationResponse(((TranslationRequest) call.getArgument(0))
            .regions().stream().map(region -> new TranslationResponse.Region(region.id(), "alvo")).toList()));

        worker(fixture.persistence(), provider, refiner, fixture.properties()).execute(job.jobRef());

        if (layout.equals("matching")) assertThat(seen).containsExactly("text_bubble", "unknown");
        else assertThat(seen).containsExactly(null, null);
        verify(fixture.persistence()).complete(eq(job.id()), any(), any(), eq(NOW));
    }

    private Fixture fixture(List<OcrManifest.Region> regions) throws Exception {
        return fixture(regions, "en");
    }

    private Fixture fixture(List<OcrManifest.Region> regions, String sourceLanguage) throws Exception {
        var properties = properties();
        properties.getTranslation().setEnabledPairs(List.of(sourceLanguage + ":pt-BR"));
        var jobId = UUID.randomUUID();
        var jobRef = UUID.randomUUID();
        var manifest = new OcrManifest("1.0", jobRef, sourceLanguage, 100, 100, regions);
        var encoded = new OcrManifestService(GatewayJsonMapper.create()).encode(manifest);
        var source = Files.createTempFile(temporary, "ocr-source-", ".json");
        Files.write(source, encoded.bytes());
        var key = "private/ocr/fixture.json";
        new LocalObjectStorageAdapter(properties).store(key, source, "application/json", encoded.sha256(), NOW);
        var job = new TranslationJobRepository.WorkItem(jobId, jobRef, JobStatus.TRANSLATING,
            sourceLanguage, "pt-BR", key, encoded.sha256(), null, null);
        var persistence = mock(TranslationPersistenceUseCase.class);
        when(persistence.find(jobRef)).thenReturn(job);
        return new Fixture(job, persistence, properties);
    }

    private ProcessTranslationTaskUseCase worker(TranslationPersistenceUseCase persistence, TranslationPort provider,
                                                  GatewayProperties properties) {
        return worker(persistence, provider, TranslationRefinerPort.NONE, properties);
    }

    private ProcessTranslationTaskUseCase worker(TranslationPersistenceUseCase persistence, TranslationPort provider,
                                                  TranslationRefinerPort refiner, GatewayProperties properties) {
        when(persistence.originalAvailable(any(), any())).thenReturn(true);
        var mapper = GatewayJsonMapper.create();
        return new ProcessTranslationTaskUseCase(persistence, new LocalObjectStorageAdapter(properties),
            new OcrManifestService(mapper), new TranslationManifestService(mapper), provider, refiner,
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
