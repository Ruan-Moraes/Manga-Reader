package com.toonlira.translationgateway.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.AdditionalAnswers.delegatesTo;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.withSettings;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import tools.jackson.databind.ObjectMapper;
import com.google.cloud.vision.v1.AnnotateImageResponse;
import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.Block;
import com.google.cloud.vision.v1.BoundingPoly;
import com.google.cloud.vision.v1.Page;
import com.google.cloud.vision.v1.Paragraph;
import com.google.cloud.vision.v1.Symbol;
import com.google.cloud.vision.v1.TextAnnotation;
import com.google.cloud.vision.v1.Vertex;
import com.google.cloud.vision.v1.Word;
import com.toonlira.translationgateway.application.ProcessOcrTaskUseCase;
import com.toonlira.translationgateway.application.CleanupLifecycleObjectsUseCase;
import com.toonlira.translationgateway.application.CancelJobUseCase;
import com.toonlira.translationgateway.application.DispatchPersistenceUseCase;
import com.toonlira.translationgateway.application.CleanupGatewayUseCase;
import com.toonlira.translationgateway.application.CleanupPersistenceUseCase;
import com.toonlira.translationgateway.application.CleanupAcknowledgedResultsUseCase;
import com.toonlira.translationgateway.application.ResultExpirationUseCase;
import com.toonlira.translationgateway.application.TranslationPersistenceUseCase;
import com.toonlira.translationgateway.application.OcrPersistenceUseCase;
import com.toonlira.translationgateway.application.ProcessTranslationTaskUseCase;
import com.toonlira.translationgateway.application.ProcessRenderingTaskUseCase;
import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.application.OcrManifestService;
import com.toonlira.translationgateway.application.TranslationManifestService;
import com.toonlira.translationgateway.application.RenderManifestService;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.RenderPort;
import com.toonlira.translationgateway.application.RenderingPersistenceUseCase;
import com.toonlira.translationgateway.application.ReserveJobUseCase;
import com.toonlira.translationgateway.application.ResultAcknowledgementPersistenceUseCase;
import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.application.port.RenderingJobRepository;
import com.toonlira.translationgateway.application.port.ResultAcknowledgementRepository;
import com.toonlira.translationgateway.application.port.TranslationPort;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.ProcessingJob;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.infrastructure.ocr.FakeVisionServer;
import com.toonlira.translationgateway.infrastructure.ocr.VisionOcrAdapter;
import com.toonlira.translationgateway.infrastructure.translation.CloudTranslationAdapter;
import com.toonlira.translationgateway.infrastructure.translation.FakeTranslationServer;
import io.grpc.Status;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** Real files/fonts/codec, controller filters and PostgreSQL. Only OCR/translation are synthetic local ports. */
@Tag("testcontainers")
@Testcontainers
@ActiveProfiles("worker")
@SpringBootTest
@AutoConfigureMockMvc
@EnabledIfSystemProperty(named = "renderer.native.enabled", matches = "true")
class RenderingWorkerIntegrationTest {
    @Container static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");
    @TempDir static Path temporary;

    @DynamicPropertySource
    static void configuration(DynamicPropertyRegistry registry) throws Exception {
        var work = Files.createDirectory(temporary.resolve("work")).toRealPath();
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("gateway.storage.local-directory", () -> temporary.resolve("objects").toString());
        registry.add("gateway.rendering.mode", () -> "local");
        registry.add("gateway.rendering.temporary-directory", work::toString);
        registry.add("gateway.rendering.encoder-path", () -> System.getProperty("renderer.cwebp.path"));
        registry.add("gateway.rendering.encoder-sha256", () -> System.getProperty("renderer.cwebp.sha256"));
        registry.add("gateway.rendering.decoder-path", () -> System.getProperty("renderer.dwebp.path"));
        registry.add("gateway.rendering.decoder-sha256", () -> System.getProperty("renderer.dwebp.sha256"));
        registry.add("gateway.translation.mode", () -> "google");
        registry.add("gateway.translation.enabled-pairs", () -> "en:pt-BR");
    }

    @Autowired MockMvc mvc;
    @Autowired JdbcClient jdbc;
    @Autowired ReserveJobUseCase reserve;
    @Autowired GatewayRepository gateway;
    @MockitoSpyBean ObjectStoragePort storage;
    @Autowired RenderingPersistenceUseCase rendering;
    @Autowired OcrPersistenceUseCase ocrPersistence;
    @Autowired TranslationPersistenceUseCase translationPersistence;
    @Autowired ResultAcknowledgementRepository acknowledgements;
    @Autowired ResultAcknowledgementPersistenceUseCase acknowledgementPersistence;
    @Autowired TransactionTemplate transaction;
    @Autowired ObjectMapper mapper;
    @Autowired ProcessOcrTaskUseCase processOcr;
    @Autowired ProcessTranslationTaskUseCase processTranslation;
    @Autowired CleanupLifecycleObjectsUseCase lifecycleCleanup;
    @Autowired CancelJobUseCase cancelJob;
    @Autowired DispatchPersistenceUseCase dispatch;
    @Autowired ObjectProvider<RenderPort> renderPort;
    @Autowired GatewayProperties properties;
    @MockitoBean OcrPort ocr;
    @MockitoBean TranslationPort translation;
    @MockitoBean Clock clock;
    @MockitoSpyBean RenderingJobRepository renderingRepository;
    private Instant now;

    @BeforeEach
    void resetState() {
        jdbc.sql("DELETE FROM anonymous_installations").update();
        reset(ocr, translation, clock, renderingRepository, storage);
        now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        when(clock.instant()).thenReturn(now);
        when(ocr.available()).thenReturn(true);
        doAnswer(call -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            TranslationRequest request = call.getArgument(0);
            return new TranslationResponse(request.regions().stream()
                .map(region -> new TranslationResponse.Region(region.id(), "Olá")).toList());
        }).when(translation).translate(any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"ready", "empty", "ocr-unavailable", "translation-timeout"})
    @ExtendWith(OutputCaptureExtension.class)
    void officialSdkTransportsTraverseTheWorkerWithoutCredentialsOrRepeatedCalls(String scenario, CapturedOutput output) throws Exception {
        boolean empty = scenario.equals("empty");
        var fixture = prepare(empty, true);
        try (var visionServer = new FakeVisionServer();
             var translationServer = new FakeTranslationServer();
             var vision = new VisionOcrAdapter(visionServer.client(Duration.ofSeconds(5)), "test-project", "private-fixtures");
             var translator = new CloudTranslationAdapter(translationServer.client(Duration.ofSeconds(1)), "test-project")) {
            visionServer.handler = (request, observer) -> {
                if (scenario.equals("ocr-unavailable")) {
                    observer.onError(Status.UNAVAILABLE.withDescription("synthetic-private-response").asRuntimeException());
                } else {
                    observer.onNext(syntheticVisionPage(empty));
                    observer.onCompleted();
                }
            };
            if (scenario.equals("translation-timeout")) translationServer.handler = (request, observer) -> {
                // Accepted, but the response is lost: the worker must never repeat this RPC.
            };
            doAnswer(call -> {
                assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
                return vision.recognize(call.getArgument(0));
            }).when(ocr).recognize(any());
            doAnswer(call -> {
                assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
                return translator.translate(call.getArgument(0));
            }).when(translation).translate(any());

            postTask(fixture.job().jobRef());
            boolean failed = scenario.equals("ocr-unavailable") || scenario.equals("translation-timeout");
            var result = rendering.find(fixture.job().jobRef());
            assertThat(result.status()).isEqualTo(failed ? JobStatus.FAILED : JobStatus.READY);
            assertThat(visionServer.lastRequest.getParent()).isEqualTo("projects/test-project/locations/us");
            assertThat(visionServer.lastRequest.getRequests(0).getImage().getContent().isEmpty()).isTrue();
            assertThat(visionServer.lastRequest.getRequests(0).getImage().getSource().getGcsImageUri())
                .isEqualTo("gs://private-fixtures/" + result.originalObjectKey());
            if (failed) {
                assertThat(result.artifacts()).isNull();
                assertThat(jdbc.sql("SELECT error_code FROM processing_jobs WHERE id = :id")
                    .param("id", result.id()).query(String.class).single())
                    .isEqualTo(scenario.equals("ocr-unavailable") ? "ocr-unavailable" : "translation-unavailable");
                assertKnownObjectsRemoved(result.id());
            } else {
                assertThat(hash(read(result.artifacts().imageObjectKey()))).isEqualTo(result.artifacts().image().sha256());
                var manifest = read(result.artifacts().manifestObjectKey());
                assertThat(hash(manifest)).isEqualTo(result.artifacts().manifestSha256());
                var regions = mapper.readTree(manifest).path("regions");
                assertThat(regions.size()).isEqualTo(empty ? 0 : 1);
                if (!empty) assertThat(regions.get(0).path("translatedText").asText()).isEqualTo("Hello");
                assertThat(jdbc.sql("SELECT status FROM processing_job_stages WHERE job_id = :id ORDER BY stage")
                    .param("id", result.id()).query(String.class).list()).containsExactly("SUCCEEDED", "SUCCEEDED", "SUCCEEDED");
            }
            postTask(fixture.job().jobRef());
            assertThat(visionServer.calls).hasValue(1);
            assertThat(translationServer.calls).hasValue(empty || scenario.equals("ocr-unavailable") ? 0 : 1);
            assertThat(hash(Files.readAllBytes(fixture.reusable()))).isEqualTo(result.source().sha256());
            assertThat(Files.exists(objectPath(result.originalObjectKey()))).isFalse();
            mvc.perform(get("/v1/capabilities")).andExpect(status().isForbidden());
            assertThat(output).doesNotContain("synthetic-private-response", "gs://private-fixtures/",
                result.originalObjectKey(), fixture.job().jobRef().toString(), fixture.reusable().toString());
        }
    }

    private static BatchAnnotateImagesResponse syntheticVisionPage(boolean empty) {
        var page = Page.newBuilder().setWidth(100).setHeight(80);
        if (!empty) {
            var polygon = BoundingPoly.newBuilder()
                .addVertices(Vertex.newBuilder().setX(10).setY(10))
                .addVertices(Vertex.newBuilder().setX(90).setY(10))
                .addVertices(Vertex.newBuilder().setX(90).setY(60))
                .addVertices(Vertex.newBuilder().setX(10).setY(60));
            page.addBlocks(Block.newBuilder().addParagraphs(Paragraph.newBuilder().setBoundingBox(polygon)
                .addWords(Word.newBuilder().addSymbols(Symbol.newBuilder().setText("Hello")))));
        }
        return BatchAnnotateImagesResponse.newBuilder().addResponses(AnnotateImageResponse.newBuilder()
            .setFullTextAnnotation(TextAnnotation.newBuilder().setText(empty ? "" : "Hello").addPages(page))).build();
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void fullWorkerProducesRealWebpAndBoundManifestAndDoesNotRepeatProviders(boolean empty) throws Exception {
        var fixture = prepare(empty);
        postTask(fixture.job().jobRef());
        var completed = rendering.find(fixture.job().jobRef());
        assertThat(completed.status()).isEqualTo(JobStatus.READY);
        var artifacts = completed.artifacts();
        assertThat(artifacts).isNotNull();
        assertThat(jdbc.sql("SELECT status FROM processing_job_stages WHERE job_id = :id ORDER BY stage")
            .param("id", fixture.job().id()).query(String.class).list()).containsExactly("SUCCEEDED", "SUCCEEDED", "SUCCEEDED");
        assertThat(hash(read(artifacts.imageObjectKey()))).isEqualTo(artifacts.image().sha256());
        var manifest = read(artifacts.manifestObjectKey());
        assertThat(hash(manifest)).isEqualTo(artifacts.manifestSha256());
        var document = mapper.readTree(manifest);
        assertThat(document.path("regions").size()).isEqualTo(empty ? 0 : 1);
        if (!empty) assertThat(document.path("regions").get(0).path("translatedText").asText()).isEqualTo("Olá");
        assertThat(Files.exists(objectPath(completed.originalObjectKey()))).isFalse();
        assertThat(hash(Files.readAllBytes(fixture.reusable()))).isEqualTo(completed.source().sha256());
        postTask(fixture.job().jobRef());
        verify(ocr, times(1)).recognize(any());
        if (empty) verifyNoInteractions(translation);
        else verify(translation, times(1)).translate(any());
        verify(renderingRepository, times(1)).complete(any(), any(), any());
        mvc.perform(get("/v1/capabilities")).andExpect(status().isForbidden());

        transaction.executeWithoutResult(ignored -> acknowledgements.request(fixture.job().installationId(), fixture.job().jobRef(), now));
        var claims = acknowledgementPersistence.claim(100, now, now.plusSeconds(60));
        assertThat(claims).hasSize(1);
        assertThat(claims.getFirst().objectKeys()).containsExactlyInAnyOrder(completed.originalObjectKey(),
            completed.ocrObjectKey(), completed.translationObjectKey(), artifacts.imageObjectKey(), artifacts.manifestObjectKey());
        for (var key : claims.getFirst().objectKeys()) storage.delete(key);
        assertThat(rendering.find(fixture.job().jobRef()).artifacts()).isEqualTo(artifacts);
    }

    @Test
    void cancellationDuringTranslationPreventsRenderingAndLeavesNoFinalOutput() throws Exception {
        var fixture = prepare(false);
        doAnswer(call -> {
            transaction.executeWithoutResult(ignored -> gateway.cancel(fixture.job().installationId(), fixture.job().jobRef(), now));
            TranslationRequest request = call.getArgument(0);
            return new TranslationResponse(List.of(new TranslationResponse.Region(request.regions().getFirst().id(), "Olá")));
        }).when(translation).translate(any());
        postTask(fixture.job().jobRef());
        assertThat(rendering.find(fixture.job().jobRef()).status()).isEqualTo(JobStatus.CANCELLED);
        assertThat(rendering.find(fixture.job().jobRef()).artifacts()).isNull();
        verify(renderingRepository, times(0)).complete(any(), any(), any());
        assertThat(Files.exists(fixture.reusable())).isTrue();
        assertThat(Files.exists(objectPath(rendering.find(fixture.job().jobRef()).originalObjectKey()))).isFalse();
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void realTransactionRollbackOrLostAckDoesNotRenderTwice(boolean lostAck) throws Exception {
        var fixture = prepare(false);
        processOcr.execute(fixture.job().jobRef());
        processTranslation.execute(fixture.job().jobRef());
        var injected = mock(RenderingPersistenceUseCase.class, withSettings().defaultAnswer(delegatesTo(rendering)));
        doAnswer(call -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            if (lostAck) {
                assertThat(rendering.complete(call.getArgument(0), call.getArgument(1), call.getArgument(2))).isTrue();
                transaction.executeWithoutResult(ignored -> acknowledgements.request(fixture.job().installationId(), fixture.job().jobRef(), now));
            } else transaction.executeWithoutResult(ignored -> {
                assertThat(renderingRepository.complete(call.getArgument(0), call.getArgument(1), call.getArgument(2))).isTrue();
                throw new IllegalStateException("synthetic rollback");
            });
            throw new IllegalStateException("synthetic acknowledgement lost after committed wrapper");
        }).when(injected).complete(any(), any(), any());
        var worker = new ProcessRenderingTaskUseCase(injected, storage, new MediaInspectionService(),
            new OcrManifestService(mapper), new TranslationManifestService(mapper), new RenderManifestService(mapper),
            renderPort, properties, clock, lifecycleCleanup);
        worker.execute(fixture.job().jobRef());
        var result = rendering.find(fixture.job().jobRef());
        assertThat(result.status()).isEqualTo(lostAck ? JobStatus.RESULT_EXPIRED : JobStatus.FAILED);
        assertThat(result.artifacts() != null).isEqualTo(lostAck);
        if (lostAck) {
            assertThat(hash(read(result.artifacts().imageObjectKey()))).isEqualTo(result.artifacts().image().sha256());
            assertThat(hash(read(result.artifacts().manifestObjectKey()))).isEqualTo(result.artifacts().manifestSha256());
        }
        postTask(fixture.job().jobRef());
        verify(ocr, times(1)).recognize(any());
        verify(translation, times(1)).translate(any());
        verify(renderingRepository, times(1)).complete(any(), any(), any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"image-upload", "manifest-upload", "cancel-at-commit"})
    void realStorageFailureOrCancellationRemovesBothOwnedOutputs(String boundary) throws Exception {
        var fixture = prepare(false);
        if (boundary.equals("cancel-at-commit")) doAnswer(call -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isTrue();
            gateway.cancel(fixture.job().installationId(), fixture.job().jobRef(), now);
            return call.callRealMethod();
        }).when(renderingRepository).complete(any(), any(), any());
        else doAnswer(call -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            call.callRealMethod();
            String key = call.getArgument(0);
            if (key.startsWith("private/rendering/") && key.endsWith(boundary.equals("image-upload") ? ".webp" : ".json"))
                throw new IllegalStateException("synthetic storage acknowledgement lost");
            return null;
        }).when(storage).store(any(), any(), any(), any(), any());
        postTask(fixture.job().jobRef());
        var result = rendering.find(fixture.job().jobRef());
        assertThat(result.status()).isEqualTo(boundary.equals("cancel-at-commit") ? JobStatus.CANCELLED : JobStatus.FAILED);
        assertThat(result.artifacts()).isNull();
        var directory = objectPath("private/rendering/" + fixture.job().id());
        if (Files.exists(directory)) try (var files = Files.list(directory)) { assertThat(files.filter(Files::isRegularFile)).isEmpty(); }
        assertThat(Files.exists(objectPath(result.originalObjectKey()))).isFalse();
        assertThat(Files.exists(fixture.reusable())).isTrue();
        postTask(fixture.job().jobRef());
        verify(ocr, times(1)).recognize(any());
        verify(translation, times(1)).translate(any());
    }

    @ParameterizedTest
    @CsvSource({"ocr,true", "ocr,false", "translation,true", "translation,false", "rendering,true", "rendering,false"})
    void unresolvedCommitMustSettleBeforeDeletingUploadedArtifacts(String stage, boolean commit) throws Exception {
        var fixture = prepare(false);
        if (!stage.equals("ocr")) processOcr.execute(fixture.job().jobRef());
        if (stage.equals("rendering")) processTranslation.execute(fixture.job().jobRef());
        var entered = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var pending = new AtomicReference<Future<?>>();
        var prematureDeletes = new AtomicInteger();
        String prefix = "private/" + stage + "/";
        doAnswer(call -> {
            if (((String) call.getArgument(0)).startsWith(prefix) && release.getCount() != 0) prematureDeletes.incrementAndGet();
            return call.callRealMethod();
        }).when(storage).delete(any());

        try (var pool = Executors.newFixedThreadPool(2)) {
            Runnable invocation;
            if (stage.equals("ocr")) {
                var injected = mock(OcrPersistenceUseCase.class, withSettings().defaultAnswer(delegatesTo(ocrPersistence)));
                doAnswer(call -> {
                    deferCommit(pool, pending, entered, release, commit, () -> assertThat(ocrPersistence.complete(
                        call.getArgument(0), call.getArgument(1), call.getArgument(2), call.getArgument(3))).isTrue());
                    throw new IllegalStateException("synthetic commit outcome not yet resolved");
                }).when(injected).complete(any(), any(), any(), any());
                var worker = new ProcessOcrTaskUseCase(injected, storage, new MediaInspectionService(), ocr,
                    new OcrManifestService(mapper), properties, clock, lifecycleCleanup);
                invocation = () -> worker.execute(fixture.job().jobRef());
            } else if (stage.equals("translation")) {
                var injected = mock(TranslationPersistenceUseCase.class, withSettings().defaultAnswer(delegatesTo(translationPersistence)));
                doAnswer(call -> {
                    deferCommit(pool, pending, entered, release, commit, () -> assertThat(translationPersistence.complete(
                        call.getArgument(0), call.getArgument(1), call.getArgument(2), call.getArgument(3))).isTrue());
                    throw new IllegalStateException("synthetic commit outcome not yet resolved");
                }).when(injected).complete(any(), any(), any(), any());
                var worker = new ProcessTranslationTaskUseCase(injected, storage, new OcrManifestService(mapper),
                    new TranslationManifestService(mapper), translation, properties, clock, lifecycleCleanup);
                invocation = () -> worker.execute(fixture.job().jobRef());
            } else {
                var injected = mock(RenderingPersistenceUseCase.class, withSettings().defaultAnswer(delegatesTo(rendering)));
                doAnswer(call -> {
                    deferCommit(pool, pending, entered, release, commit, () -> assertThat(rendering.complete(
                        call.getArgument(0), call.getArgument(1), call.getArgument(2))).isTrue());
                    throw new IllegalStateException("synthetic commit outcome not yet resolved");
                }).when(injected).complete(any(), any(), any());
                var worker = new ProcessRenderingTaskUseCase(injected, storage, new MediaInspectionService(),
                    new OcrManifestService(mapper), new TranslationManifestService(mapper), new RenderManifestService(mapper),
                    renderPort, properties, clock, lifecycleCleanup);
                invocation = () -> worker.execute(fixture.job().jobRef());
            }
            var worker = pool.submit(invocation);
            try {
                assertThat(entered.await(10, TimeUnit.SECONDS)).isTrue();
                awaitCommitResolutionLock();
                assertThat(prematureDeletes.get()).as("unresolved upload must not be deleted before the job lock").isZero();
            } finally {
                release.countDown();
                worker.get(20, TimeUnit.SECONDS);
                if (pending.get() != null) pending.get().get(20, TimeUnit.SECONDS);
            }
        }
        var result = rendering.find(fixture.job().jobRef());
        assertThat(result.status()).isEqualTo(!commit ? JobStatus.FAILED : switch (stage) {
            case "ocr" -> JobStatus.TRANSLATING;
            case "translation" -> JobStatus.RENDERING;
            default -> JobStatus.READY;
        });
        if (commit) {
            String key = stage.equals("ocr") ? result.ocrObjectKey() : stage.equals("translation")
                ? result.translationObjectKey() : result.artifacts().manifestObjectKey();
            String expectedHash = stage.equals("ocr") ? result.ocrSha256() : stage.equals("translation")
                ? result.translationSha256() : result.artifacts().manifestSha256();
            assertThat(hash(read(key))).isEqualTo(expectedHash);
            if (stage.equals("rendering")) assertThat(hash(read(result.artifacts().imageObjectKey())))
                .isEqualTo(result.artifacts().image().sha256());
        } else assertKnownObjectsRemoved(fixture.job().id());
        postTask(fixture.job().jobRef());
        assertThat(rendering.find(fixture.job().jobRef()).status()).isEqualTo(commit ? JobStatus.READY : JobStatus.FAILED);
        verify(ocr, times(1)).recognize(any());
        verify(translation, times(stage.equals("ocr") && !commit ? 0 : 1)).translate(any());
        assertThat(hash(Files.readAllBytes(fixture.reusable()))).isEqualTo(result.source().sha256());
    }

    private void deferCommit(ExecutorService pool, AtomicReference<Future<?>> pending,
                             CountDownLatch entered, CountDownLatch release, boolean commit, Runnable completion) throws Exception {
        pending.set(pool.submit(() -> transaction.executeWithoutResult(status -> {
            completion.run();
            entered.countDown();
            try { assertThat(release.await(10, TimeUnit.SECONDS)).isTrue(); }
            catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new AssertionError("fixture interrupted"); }
            if (!commit) status.setRollbackOnly();
        })));
        assertThat(entered.await(10, TimeUnit.SECONDS)).isTrue();
    }

    private void awaitCommitResolutionLock() throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
        while (System.nanoTime() < deadline) {
            if (jdbc.sql("SELECT count(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND query LIKE '%processing_jobs%'")
                .query(Integer.class).single() > 0) return;
            Thread.sleep(10);
        }
        throw new AssertionError("worker did not reach the PostgreSQL commit-resolution lock");
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void concurrentDeliveryDoesNotRepeatChargedStagesOrConfirmActiveCancellation(boolean cancel) throws Exception {
        var fixture = prepare(false);
        var entered = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        doAnswer(call -> {
            entered.countDown();
            assertThat(release.await(10, TimeUnit.SECONDS)).isTrue();
            return List.of(new OcrManifest.Region(UUID.randomUUID(), 0, "Hello", List.of(
                new OcrManifest.Vertex(.1, .1), new OcrManifest.Vertex(.9, .1), new OcrManifest.Vertex(.9, .9), new OcrManifest.Vertex(.1, .9))));
        }).when(ocr).recognize(any());
        try (var pool = Executors.newSingleThreadExecutor()) {
            var first = pool.submit(() -> { postTask(fixture.job().jobRef()); return null; });
            try {
                assertThat(entered.await(10, TimeUnit.SECONDS)).isTrue();
                if (cancel) transaction.executeWithoutResult(ignored -> gateway.cancel(fixture.job().installationId(), fixture.job().jobRef(), now));
                postTask(fixture.job().jobRef());
                assertThat(rendering.find(fixture.job().jobRef()).status()).isEqualTo(cancel ? JobStatus.CANCEL_PENDING : JobStatus.OCR);
                assertThat(Files.exists(objectPath(rendering.find(fixture.job().jobRef()).originalObjectKey()))).isTrue();
            } finally { release.countDown(); }
            first.get(20, TimeUnit.SECONDS);
        }
        assertThat(rendering.find(fixture.job().jobRef()).status()).isEqualTo(cancel ? JobStatus.CANCELLED : JobStatus.READY);
        verify(ocr, times(1)).recognize(any());
        if (cancel) verifyNoInteractions(translation);
        else verify(translation, times(1)).translate(any());
        verify(renderingRepository, times(cancel ? 0 : 1)).complete(any(), any(), any());
        assertThat(Files.exists(objectPath(rendering.find(fixture.job().jobRef()).originalObjectKey()))).isFalse();
    }

    @ParameterizedTest
    @ValueSource(strings = {"ocr", "translation"})
    void chargedStageFailureImmediatelyRemovesKnownObjectsWithoutRepeatingProvider(String stage) throws Exception {
        var fixture = prepare(false);
        if (stage.equals("ocr")) doThrow(new IllegalStateException("synthetic private response")).when(ocr).recognize(any());
        else doThrow(new IllegalStateException("synthetic private response")).when(translation).translate(any());
        postTask(fixture.job().jobRef());
        assertThat(rendering.find(fixture.job().jobRef()).status()).isEqualTo(JobStatus.FAILED);
        assertKnownObjectsRemoved(fixture.job().id());
        assertThat(lifecycleCompleted(fixture.job().id())).isTrue();
        assertThat(hash(Files.readAllBytes(fixture.reusable())))
            .isEqualTo(rendering.find(fixture.job().jobRef()).source().sha256());
        postTask(fixture.job().jobRef());
        verify(ocr, times(1)).recognize(any());
        if (stage.equals("ocr")) verifyNoInteractions(translation);
        else verify(translation, times(1)).translate(any());
    }

    @Test
    void failedImmediateOriginalDeleteRemainsDurableAndRetryDoesNotDeleteReadyResult() throws Exception {
        var fixture = prepare(false);
        var originalKey = rendering.find(fixture.job().jobRef()).originalObjectKey();
        doThrow(new IllegalStateException("synthetic delete unavailable")).when(storage).delete(originalKey);
        postTask(fixture.job().jobRef());
        var ready = rendering.find(fixture.job().jobRef());
        assertThat(ready.status()).isEqualTo(JobStatus.READY);
        assertThat(Files.exists(objectPath(ready.originalObjectKey()))).isTrue();
        assertThat(lifecycleCompleted(fixture.job().id())).isFalse();
        reset(storage);
        when(clock.instant()).thenReturn(now.plusSeconds(61));
        assertThat(lifecycleCleanup.executeForJob(fixture.job().id()))
            .isEqualTo(new CleanupLifecycleObjectsUseCase.Result(1, 0));
        assertThat(lifecycleCompleted(fixture.job().id())).isTrue();
        assertThat(Files.exists(objectPath(ready.originalObjectKey()))).isFalse();
        assertThat(hash(read(ready.artifacts().imageObjectKey()))).isEqualTo(ready.artifacts().image().sha256());
        assertThat(hash(read(ready.artifacts().manifestObjectKey()))).isEqualTo(ready.artifacts().manifestSha256());
        assertThat(rendering.find(fixture.job().jobRef()).status()).isEqualTo(JobStatus.READY);
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_result_acknowledgements WHERE job_id = :id")
            .param("id", fixture.job().id()).query(Integer.class).single()).isZero();
        assertThat(Files.exists(fixture.reusable())).isTrue();
    }

    @Test
    void unregisteredLateUploadIsRemovedByAgeFailsafeEvenIfSqlPhaseFails() throws Exception {
        var fixture = prepare(false);
        var orphanKeys = new ArrayList<String>();
        doAnswer(call -> {
            call.callRealMethod();
            String key = call.getArgument(0);
            if (key.startsWith("private/rendering/")) {
                orphanKeys.add(key);
                throw new IllegalStateException("synthetic upload acknowledgement lost");
            }
            return null;
        }).when(storage).store(any(), any(), any(), any(), any());
        doThrow(new IllegalStateException("synthetic orphan deletion unavailable")).when(storage)
            .delete(argThat(key -> key.startsWith("private/rendering/")));
        postTask(fixture.job().jobRef());
        assertThat(rendering.find(fixture.job().jobRef()).status()).isEqualTo(JobStatus.FAILED);
        assertThat(orphanKeys).hasSize(1);
        assertThat(Files.exists(objectPath(orphanKeys.getFirst()))).isTrue();
        assertKnownObjectsRemoved(fixture.job().id());
        assertThat(lifecycleCompleted(fixture.job().id())).isTrue();
        reset(storage);
        var later = now.plusSeconds(3601);
        when(clock.instant()).thenReturn(later);
        var failedSql = mock(OcrPersistenceUseCase.class);
        when(failedSql.failStale(eq(later.minusSeconds(900)), eq(later), eq(100)))
            .thenThrow(new IllegalStateException("sensitive SQL detail"));
        var metadata = mock(CleanupPersistenceUseCase.class);
        when(metadata.execute(later)).thenReturn(new CleanupPersistenceUseCase.Result(0, 0));
        var acknowledgements = mock(CleanupAcknowledgedResultsUseCase.class);
        when(acknowledgements.execute()).thenReturn(new CleanupAcknowledgedResultsUseCase.Result(0, 0));
        var cleanup = new CleanupGatewayUseCase(metadata, storage, failedSql,
            mock(TranslationPersistenceUseCase.class), rendering, acknowledgements,
            mock(ResultExpirationUseCase.class), lifecycleCleanup, clock);
        assertThatThrownBy(cleanup::execute).isInstanceOfSatisfying(GatewayException.class, error -> {
            assertThat(error.code()).isEqualTo(GatewayErrorCode.INTERNAL_ERROR);
            assertThat(error.getCause()).isNull();
        });
        assertThat(Files.exists(objectPath(orphanKeys.getFirst()))).isFalse();
        verify(metadata).execute(later);
        assertThat(Files.exists(fixture.reusable())).isTrue();
        verify(ocr, times(1)).recognize(any());
        verify(translation, times(1)).translate(any());
    }

    private boolean lifecycleCompleted(UUID jobId) {
        return jdbc.sql("SELECT completed_at IS NOT NULL FROM processing_job_lifecycle_cleanups WHERE job_id = :id")
            .param("id", jobId).query(Boolean.class).single();
    }

    @Test
    void confirmedDispatchSurvivesLateFailureWithoutDeletingTheRealOriginal() throws Exception {
        var target = prepare(false);
        var originalKey = rendering.find(target.job().jobRef()).originalObjectKey();
        jdbc.sql("UPDATE processing_job_dispatches SET attempt_count = 8 WHERE job_id = :id")
            .param("id", target.job().id()).update();
        assertThat(dispatch.complete(target.job().id(), 8, now)).isTrue();
        assertThat(dispatch.fail(target.job().id(), 8, 8, now.plusSeconds(1))).isFalse();
        assertThat(Files.exists(objectPath(originalKey))).isTrue();
        assertThat(Files.exists(target.reusable())).isTrue();
        assertThat(rendering.find(target.job().jobRef()).status()).isEqualTo(JobStatus.QUEUED);
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_lifecycle_cleanups WHERE job_id = :id")
            .param("id", target.job().id()).query(Integer.class).single()).isZero();
        verify(storage, times(0)).delete(any());
        verifyNoInteractions(translation);
        verify(ocr, times(0)).recognize(any());
    }

    @ParameterizedTest
    @ValueSource(strings = {"cancel", "dispatch"})
    void controlCommitRemovesOnlyItsOwnOriginalAndPreservesReusableAndActiveJobs(String path) throws Exception {
        var target = prepare(false);
        var active = prepare(false);
        var originalKey = rendering.find(target.job().jobRef()).originalObjectKey();
        var activeKey = rendering.find(active.job().jobRef()).originalObjectKey();
        doAnswer(call -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            assertThat(rendering.find(target.job().jobRef()).status())
                .isEqualTo(path.equals("cancel") ? JobStatus.CANCELLED : JobStatus.FAILED);
            return call.callRealMethod();
        }).when(storage).delete(originalKey);
        transaction.executeWithoutResult(ignored -> {
            if (path.equals("cancel")) cancelJob.execute(target.job().installationId(), target.job().jobRef());
            else {
                jdbc.sql("UPDATE processing_job_dispatches SET attempt_count = 8 WHERE job_id = :id")
                    .param("id", target.job().id()).update();
                dispatch.fail(target.job().id(), 8, 8, now);
            }
            assertThat(Files.exists(objectPath(originalKey))).isTrue();
            assertThat(Files.exists(objectPath(activeKey))).isTrue();
        });
        assertThat(Files.exists(objectPath(originalKey))).isFalse();
        assertThat(Files.exists(objectPath(activeKey))).isTrue();
        assertThat(rendering.find(active.job().jobRef()).status()).isEqualTo(JobStatus.QUEUED);
        assertThat(lifecycleCompleted(target.job().id())).isTrue();
        assertThat(Files.exists(target.reusable())).isTrue();
        assertThat(Files.exists(active.reusable())).isTrue();
        verifyNoInteractions(translation);
        verify(ocr, times(0)).recognize(any());
    }

    private void assertKnownObjectsRemoved(UUID jobId) {
        var keys = jdbc.sql("""
            SELECT original_object_key FROM processing_jobs WHERE id = :id
            UNION SELECT output_object_key FROM processing_job_stages WHERE job_id = :id AND output_object_key IS NOT NULL
            UNION SELECT output_object_key FROM processing_job_layouts WHERE job_id = :id AND output_object_key IS NOT NULL
            """).param("id", jobId).query(String.class).list();
        assertThat(keys).isNotEmpty();
        for (var key : keys) assertThat(Files.exists(objectPath(key))).isFalse();
    }

    private Fixture prepare(boolean empty) throws Exception {
        return prepare(empty, false);
    }

    private Fixture prepare(boolean empty, boolean sdk) throws Exception {
        var source = Files.createTempFile(temporary, "reusable-", ".png");
        var image = new BufferedImage(100, 80, BufferedImage.TYPE_INT_RGB);
        var graphics = image.createGraphics();
        try { graphics.setColor(Color.WHITE); graphics.fillRect(0, 0, 100, 80); }
        finally { graphics.dispose(); }
        ImageIO.write(image, "png", source.toFile());
        String originalHash = hash(Files.readAllBytes(source));
        UUID installation = UUID.randomUUID(), jobId = UUID.randomUUID(), ref = UUID.randomUUID();
        transaction.executeWithoutResult(ignored -> gateway.createInstallation(installation, "test-hash-" + installation, now));
        var key = (sdk ? "private/originals/" : "private/original/") + jobId;
        storage.store(key, source, "image/png", originalHash, now);
        var job = reserve.execute(new GatewayRepository.NewJob(jobId, ref, installation, UUID.randomUUID(), UUID.randomUUID(),
            "test-version", "en", "pt-BR", "image/png", Files.size(source), 100, 80, key, originalHash,
            "1".repeat(64), now, now.plus(7, ChronoUnit.DAYS))).job();
        when(ocr.recognize(any())).thenAnswer(call -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            return empty ? List.of() : List.of(new OcrManifest.Region(UUID.randomUUID(), 0, "Hello", List.of(
                new OcrManifest.Vertex(.1, .1), new OcrManifest.Vertex(.9, .1), new OcrManifest.Vertex(.9, .9), new OcrManifest.Vertex(.1, .9))));
        });
        return new Fixture(job, source);
    }

    private void postTask(UUID ref) throws Exception {
        mvc.perform(post("/internal/tasks/ocr").contentType("application/json").content("{\"jobRef\":\"" + ref + "\"}"))
            .andExpect(status().isNoContent());
    }

    private Path objectPath(String key) { return temporary.resolve("objects").resolve(key); }
    private byte[] read(String key) throws Exception { try (var input = storage.open(key)) { return input.readAllBytes(); } }
    private static String hash(byte[] bytes) throws Exception { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)); }
    private record Fixture(ProcessingJob job, Path reusable) { }
}
