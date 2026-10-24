package com.toonlira.translationgateway.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.withSettings;
import static org.mockito.AdditionalAnswers.delegatesTo;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.application.OcrManifestService;
import com.toonlira.translationgateway.application.ProcessOcrTaskUseCase;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.layout.LayoutOutcome;
import com.toonlira.translationgateway.domain.layout.LayoutManifest;
import com.toonlira.translationgateway.domain.layout.LayoutInterpreter;
import com.toonlira.translationgateway.domain.layout.ReadingDirection;
import com.toonlira.translationgateway.application.ShadowLayoutService;
import com.toonlira.translationgateway.application.port.LayoutPort;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.infrastructure.layout.ComicDetectorModel;
import com.toonlira.translationgateway.infrastructure.ocr.FakeVisionServer;
import com.toonlira.translationgateway.infrastructure.ocr.VisionOcrAdapter;
import com.toonlira.translationgateway.infrastructure.storage.LocalObjectStorageAdapter;
import com.toonlira.translationgateway.infrastructure.translation.CloudTranslationAdapter;
import com.toonlira.translationgateway.infrastructure.translation.FakeTranslationServer;
import com.google.cloud.translate.v3.TranslateTextResponse;
import io.grpc.Status;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.util.HexFormat;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import com.toonlira.translationgateway.application.DispatchPersistenceUseCase;
import com.toonlira.translationgateway.application.OcrPersistenceUseCase;
import com.toonlira.translationgateway.application.CleanupLifecycleObjectsUseCase;
import com.toonlira.translationgateway.application.LifecycleCleanupPersistenceUseCase;
import com.toonlira.translationgateway.application.TranslationPersistenceUseCase;
import com.toonlira.translationgateway.application.AcknowledgeResultUseCase;
import com.toonlira.translationgateway.application.CleanupAcknowledgedResultsUseCase;
import com.toonlira.translationgateway.application.ResultAcknowledgementPersistenceUseCase;
import com.toonlira.translationgateway.application.port.ResultAcknowledgementRepository;
import com.toonlira.translationgateway.application.ProcessTranslationTaskUseCase;
import com.toonlira.translationgateway.application.TranslationManifestService;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import static org.mockito.ArgumentMatchers.eq;
import com.toonlira.translationgateway.application.ReserveJobUseCase;
import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.application.port.OcrJobRepository;
import com.toonlira.translationgateway.application.port.TranslationJobRepository;
import com.toonlira.translationgateway.domain.GatewayException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.stream.IntStream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.RepeatedTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Tag("testcontainers")
@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class GatewaySchemaMigrationTest {
    @TempDir Path workerTemporary;
    @Container
    private static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void configureDatabase(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private JdbcClient jdbcClient;
    @Autowired
    private ReserveJobUseCase reserveJob;
    @Autowired
    private DispatchPersistenceUseCase dispatchPersistence;
    @Autowired
    private GatewayRepository repository;
    @Autowired
    private OcrJobRepository ocrRepository;
    @Autowired
    private OcrPersistenceUseCase ocrPersistence;
    @Autowired
    private TranslationPersistenceUseCase translationPersistence;
    @Autowired private AcknowledgeResultUseCase acknowledgeResult;
    @Autowired private ResultAcknowledgementPersistenceUseCase acknowledgementPersistence;
    @Autowired private ResultAcknowledgementRepository acknowledgementRepository;
    @Autowired private LifecycleCleanupPersistenceUseCase lifecyclePersistence;
    @Autowired
    private TransactionTemplate transactionTemplate;

    @BeforeEach
    void cleanDatabase() {
        jdbcClient.sql("DELETE FROM anonymous_sessions").update();
        jdbcClient.sql("DELETE FROM processing_jobs").update();
        jdbcClient.sql("DELETE FROM anonymous_installations").update();
    }

    @Test
    void shouldApplyFlywayAndEnforceIdempotencyAndOutboxRelations() {
        var installationId = UUID.randomUUID();
        var createdAt = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        jdbcClient.sql("""
                INSERT INTO anonymous_installations
                    (id, credential_hash, status, created_at, last_seen_at)
                VALUES (:id, :credentialHash, 'ACTIVE', :createdAt, :createdAt)
                """)
            .param("id", installationId)
            .param("credentialHash", "argon2id:test:" + installationId)
            .param("createdAt", timestamp(createdAt))
            .update();

        var idempotencyKey = UUID.randomUUID();
        var firstJobId = insertJob(installationId, idempotencyKey, UUID.randomUUID(), createdAt);
        jdbcClient.sql("""
                INSERT INTO processing_job_dispatches
                    (job_id, status, next_attempt_at, created_at, updated_at)
                VALUES (:jobId, 'PENDING', :createdAt, :createdAt, :createdAt)
                """)
            .param("jobId", firstJobId)
            .param("createdAt", timestamp(createdAt))
            .update();

        assertThat(tableExists("anonymous_installations")).isTrue();
        assertThat(tableExists("anonymous_sessions")).isTrue();
        assertThat(tableExists("processing_jobs")).isTrue();
        assertThat(tableExists("processing_job_stages")).isTrue();
        assertThat(tableExists("processing_job_dispatches")).isTrue();

        assertThatThrownBy(() -> insertJob(installationId, idempotencyKey, UUID.randomUUID(), createdAt))
            .isInstanceOf(DuplicateKeyException.class);

        jdbcClient.sql("DELETE FROM processing_jobs WHERE id = :jobId")
            .param("jobId", firstJobId)
            .update();
        assertThat(countDispatches(firstJobId)).isZero();
    }

    @Test
    void shouldSerializeConcurrentIdempotentReservationsIntoOneJob() throws Exception {
        var installationId = createInstallation();
        var idempotencyKey = UUID.randomUUID();
        var attemptRef = UUID.randomUUID();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        Callable<ReserveJobUseCase.Result> first = () -> reserveJob.execute(candidate(installationId, idempotencyKey, attemptRef, now));
        Callable<ReserveJobUseCase.Result> second = () -> reserveJob.execute(candidate(installationId, idempotencyKey, attemptRef, now));

        List<ReserveJobUseCase.Result> results;
        try (var executor = Executors.newFixedThreadPool(2)) {
            results = executor.invokeAll(List.of(first, second)).stream().map(future -> {
                try { return future.get(); } catch (Exception error) { throw new IllegalStateException(error); }
            }).toList();
        }

        assertThat(results).extracting(ReserveJobUseCase.Result::created).containsExactlyInAnyOrder(true, false);
        assertThat(results).extracting(result -> result.job().jobRef()).containsOnly(results.getFirst().job().jobRef());
        assertThat(jdbcClient.sql("SELECT COUNT(*) FROM processing_jobs").query(Long.class).single()).isOne();
    }

    @Test
    void shouldLeaseOutboxClaimsAndEnforceInstallationQuota() {
        var installationId = createInstallation();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        for (int index = 0; index < 20; index++) {
            reserveJob.execute(candidate(installationId, UUID.randomUUID(), UUID.randomUUID(), now.plusMillis(index)));
        }

        assertThatThrownBy(() -> reserveJob.execute(candidate(installationId, UUID.randomUUID(), UUID.randomUUID(), now.plusSeconds(1))))
            .isInstanceOf(GatewayException.class);

        var claims = dispatchPersistence.claim(50, now.plusSeconds(2), now.plusSeconds(62));
        assertThat(claims).hasSize(20);
        assertThat(dispatchPersistence.claim(50, now.plusSeconds(3), now.plusSeconds(63))).isEmpty();
    }

    @Test
    void shouldEnforceTheGlobalQuotaAcrossConcurrentInstallations() throws Exception {
        var installations = IntStream.range(0, 6).mapToObj(ignored -> createInstallation()).toList();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        var requests = IntStream.range(0, 120).<Callable<Boolean>>mapToObj(index -> () -> {
            try {
                reserveJob.execute(candidate(installations.get(index % installations.size()), UUID.randomUUID(),
                    UUID.randomUUID(), now.plusMillis(index)));
                return true;
            } catch (GatewayException quota) {
                return false;
            }
        }).toList();

        List<Boolean> results;
        try (var executor = Executors.newFixedThreadPool(16)) {
            results = executor.invokeAll(requests).stream().map(future -> {
                try { return future.get(); } catch (Exception error) { throw new IllegalStateException(error); }
            }).toList();
        }

        assertThat(results).filteredOn(Boolean.TRUE::equals).hasSize(100);
        assertThat(jdbcClient.sql("SELECT COUNT(*) FROM processing_jobs").query(Long.class).single()).isEqualTo(100);
    }

    @Test
    void shouldKeepJobLookupsIsolatedByInstallation() {
        var owner = createInstallation();
        var stranger = createInstallation();
        var key = UUID.randomUUID();
        var result = reserveJob.execute(candidate(owner, key, UUID.randomUUID(), Instant.now()));

        assertThat(repository.findByJobRef(stranger, result.job().jobRef())).isEmpty();
        assertThat(repository.findByIdempotency(stranger, key)).isEmpty();
    }

    @Test
    void shouldRollbackTheJobAndOutboxTogether() {
        var installation = createInstallation();
        var candidate = candidate(installation, UUID.randomUUID(), UUID.randomUUID(), Instant.now());

        assertThatThrownBy(() -> transactionTemplate.executeWithoutResult(ignored -> {
            repository.insertJob(candidate);
            throw new IllegalStateException("rollback");
        })).isInstanceOf(IllegalStateException.class);

        assertThat(jdbcClient.sql("SELECT COUNT(*) FROM processing_jobs").query(Long.class).single()).isZero();
        assertThat(jdbcClient.sql("SELECT COUNT(*) FROM processing_job_dispatches").query(Long.class).single()).isZero();
    }

    @Test
    void shouldClaimEachOutboxEntryOnlyOnceAcrossConcurrentClaimers() throws Exception {
        var installation = createInstallation();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        for (int index = 0; index < 20; index++) {
            reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now.plusMillis(index)));
        }

        List<List<GatewayRepository.DispatchClaim>> claims;
        Callable<List<GatewayRepository.DispatchClaim>> first =
            () -> dispatchPersistence.claim(15, now.plusSeconds(1), now.plusSeconds(61));
        Callable<List<GatewayRepository.DispatchClaim>> second =
            () -> dispatchPersistence.claim(15, now.plusSeconds(1), now.plusSeconds(61));
        try (var executor = Executors.newFixedThreadPool(2)) {
            claims = executor.invokeAll(List.of(first, second))
                .stream().map(future -> {
                    try { return future.get(); } catch (Exception error) { throw new IllegalStateException(error); }
                }).toList();
        }

        var claimedIds = claims.stream().flatMap(List::stream).map(GatewayRepository.DispatchClaim::jobId).toList();
        assertThat(claimedIds).hasSize(20);
        assertThat(Set.copyOf(claimedIds)).hasSize(20);
    }

    @Test
    void shouldExpireAndRevokeSessionsAtAuthenticationTime() {
        var installation = createInstallation();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        jdbcClient.sql("""
                INSERT INTO anonymous_sessions (id, installation_id, token_hash, created_at, expires_at, revoked_at)
                VALUES (:activeId, :installation, :activeHash, :created, :future, NULL),
                       (:expiredId, :installation, :expiredHash, :created, :past, NULL),
                       (:revokedId, :installation, :revokedHash, :created, :future, :revoked)
                """)
            .param("activeId", UUID.randomUUID()).param("expiredId", UUID.randomUUID()).param("revokedId", UUID.randomUUID())
            .param("installation", installation).param("activeHash", "1".repeat(64))
            .param("expiredHash", "2".repeat(64)).param("revokedHash", "3".repeat(64))
            .param("created", timestamp(now.minusSeconds(120))).param("past", timestamp(now.minusSeconds(1)))
            .param("future", timestamp(now.plusSeconds(60))).param("revoked", timestamp(now.minusSeconds(30))).update();

        assertThat(repository.authenticateSession("1".repeat(64), now)).contains(installation);
        assertThat(repository.authenticateSession("2".repeat(64), now)).isEmpty();
        assertThat(repository.authenticateSession("3".repeat(64), now)).isEmpty();

        jdbcClient.sql("UPDATE anonymous_installations SET status = 'REVOKED', revoked_at = :now WHERE id = :id")
            .param("now", timestamp(now)).param("id", installation).update();
        assertThat(repository.authenticateSession("1".repeat(64), now)).isEmpty();
    }

    @Test
    void layoutStorageFailureDoesNotChangeOcrAndDoesNotRetry() throws Exception {
        var prepared = prepareWorkerJob();
        var failingStorage = spy(prepared.storage());
        doThrow(new IllegalStateException("private key must not escape")).when(failingStorage)
            .store(argThat(key -> key.startsWith("private/layout/")), any(), any(), any(), any());
        var layout = syntheticLayout(null);
        try (var server = new FakeVisionServer();
             var adapter = new VisionOcrAdapter(server.client(Duration.ofSeconds(5)), "test-project", "private-fixtures")) {
            var shadow = new ShadowLayoutService(layout, failingStorage, GatewayJsonMapper.create(), Clock.systemUTC());
            var worker = new ProcessOcrTaskUseCase(ocrPersistence, failingStorage, new MediaInspectionService(), adapter,
                new OcrManifestService(GatewayJsonMapper.create()), prepared.properties(), Clock.systemUTC(), shadow,
                new CleanupLifecycleObjectsUseCase(lifecyclePersistence, failingStorage, Clock.systemUTC()));
            worker.execute(prepared.job().jobRef());
            worker.execute(prepared.job().jobRef());
            assertThat(server.calls).hasValue(1);
            assertThat(ocrPersistence.find(prepared.job().jobRef()).status()).isEqualTo(JobStatus.TRANSLATING);
            assertThat(jdbcClient.sql("SELECT error_code FROM processing_job_layouts WHERE job_id = :id")
                .param("id", prepared.job().id()).query(String.class).single()).isEqualTo("layout-unavailable");
            assertManifestIntegrity(prepared.job().id());
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"success", "rollback", "lost-ack", "cancel"})
    void layoutSharesOcrCommitAndOrphanProtection(String scenario) throws Exception {
        var prepared = prepareWorkerJob();
        var injected = mock(OcrPersistenceUseCase.class, withSettings().defaultAnswer(delegatesTo(ocrPersistence)));
        if (scenario.equals("rollback") || scenario.equals("lost-ack")) {
            doAnswer(call -> {
                if (scenario.equals("lost-ack")) ocrPersistence.completeWithLayout(call.getArgument(0), call.getArgument(1),
                    call.getArgument(2), call.getArgument(3), call.getArgument(4));
                else transactionTemplate.executeWithoutResult(ignored -> {
                    ocrRepository.completeWithLayout(call.getArgument(0), call.getArgument(1), call.getArgument(2),
                        call.getArgument(3), call.getArgument(4));
                    throw new IllegalStateException("rollback");
                });
                throw new IllegalStateException("ack lost");
            }).when(injected).completeWithLayout(any(), any(), any(), any(), any());
        }
        Runnable duringInference = scenario.equals("cancel") ? () -> transactionTemplate.executeWithoutResult(ignored ->
            repository.cancel(prepared.installation(), prepared.job().jobRef(), Instant.now())) : null;
        var calls = new AtomicInteger();
        var detector = syntheticLayout(() -> {
            calls.incrementAndGet();
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            if (duringInference != null) duringInference.run();
        });
        var shadow = new ShadowLayoutService(detector, prepared.storage(), GatewayJsonMapper.create(), Clock.systemUTC());
        try (var server = new FakeVisionServer();
             var adapter = new VisionOcrAdapter(server.client(Duration.ofSeconds(5)), "test-project", "private-fixtures")) {
            var worker = new ProcessOcrTaskUseCase(injected, prepared.storage(), new MediaInspectionService(), adapter,
                new OcrManifestService(GatewayJsonMapper.create()), prepared.properties(), Clock.systemUTC(), shadow,
                new CleanupLifecycleObjectsUseCase(lifecyclePersistence, prepared.storage(), Clock.systemUTC()));
            worker.execute(prepared.job().jobRef());
            worker.execute(prepared.job().jobRef());
            assertThat(server.calls).hasValue(1);
            assertThat(calls).hasValue(1);
            boolean committed = scenario.equals("success") || scenario.equals("lost-ack");
            assertThat(ocrPersistence.find(prepared.job().jobRef()).status()).isEqualTo(committed ? JobStatus.TRANSLATING
                : scenario.equals("cancel") ? JobStatus.CANCELLED : JobStatus.FAILED);
            if (committed) {
                assertManifestIntegrity(prepared.job().id());
                var row = jdbcClient.sql("SELECT output_object_key, output_sha256 FROM processing_job_layouts WHERE job_id = :id")
                    .param("id", prepared.job().id()).query().singleRow();
                var bytes = Files.readAllBytes(workerTemporary.resolve((String) row.get("output_object_key")));
                assertThat(HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes))).isEqualTo(row.get("output_sha256"));
                // The existing one-hour object cleanup also covers experimental artifacts.
                assertThat(prepared.storage().deleteOlderThan(Instant.now().plusSeconds(3601))).isEqualTo(3);
            } else {
                assertThat(jdbcClient.sql("SELECT count(*) FROM processing_job_layouts WHERE job_id = :id")
                    .param("id", prepared.job().id()).query(Long.class).single()).isZero();
                try (var files = Files.walk(workerTemporary)) { assertThat(files.filter(Files::isRegularFile).count()).isZero(); }
            }
        }
    }

    private LayoutPort syntheticLayout(Runnable duringInference) {
        return new LayoutPort() {
            public boolean available() { return true; }
            public LayoutManifest analyze(Path image, OcrManifest ocr, String imageHash, String ocrHash) {
                if (duringInference != null) duringInference.run();
                return new LayoutInterpreter().interpret(ocr, imageHash, ocrHash, ComicDetectorModel.METADATA,
                    ReadingDirection.ltr, List.of(), List.of());
            }
        };
    }

    @Test
    void shouldCommitLayoutAtomicallyAndCascadeWithoutRedundantIndex() {
        var installation = createInstallation();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        var job = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        ocrPersistence.claim(job.jobRef(), now);
        var layout = new LayoutOutcome(LayoutOutcome.Status.SUCCEEDED, "private/layout/test.json", "c".repeat(64), null, now, now);
        assertThatThrownBy(() -> transactionTemplate.executeWithoutResult(ignored -> {
            ocrRepository.completeWithLayout(job.id(), "private/ocr/test.json", "a".repeat(64), now, layout);
            throw new IllegalStateException("injected rollback");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(jdbcClient.sql("SELECT count(*) FROM processing_job_layouts").query(Long.class).single()).isZero();
        assertThat(ocrPersistence.find(job.jobRef()).status()).isEqualTo(JobStatus.OCR);
        assertThat(ocrPersistence.completeWithLayout(job.id(), "private/ocr/test.json", "a".repeat(64), now, layout)).isTrue();
        assertThat(ocrPersistence.find(job.jobRef()).status()).isEqualTo(JobStatus.TRANSLATING);
        for (String assignment : List.of("output_sha256 = NULL", "output_sha256 = 'bad'", "stage = 'TRANSLATING'",
            "error_code = 'layout-unavailable'", "completed_at = started_at - interval '1 second'")) {
            assertThatThrownBy(() -> transactionTemplate.executeWithoutResult(ignored ->
                jdbcClient.sql("UPDATE processing_job_layouts SET " + assignment).update()))
                .isInstanceOf(DataIntegrityViolationException.class);
        }
        assertThat(jdbcClient.sql("SELECT count(*) FROM pg_indexes WHERE tablename = 'processing_job_layouts'")
            .query(Long.class).single()).isEqualTo(1);
        jdbcClient.sql("DELETE FROM processing_jobs WHERE id = :id").param("id", job.id()).update();
        assertThat(jdbcClient.sql("SELECT count(*) FROM processing_job_layouts").query(Long.class).single()).isZero();
    }

    @Test
    void shouldKeepOcrSucceededWithFailedLayoutAndOmitLayoutOnCancellation() {
        var installation = createInstallation();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        var job = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        ocrPersistence.claim(job.jobRef(), now);
        var failure = new LayoutOutcome(LayoutOutcome.Status.FAILED, null, null, "layout-timeout", now, now);
        assertThat(ocrPersistence.completeWithLayout(job.id(), "private/ocr/test.json", "a".repeat(64), now, failure)).isTrue();
        assertThat(ocrPersistence.find(job.jobRef()).status()).isEqualTo(JobStatus.TRANSLATING);
        assertThat(jdbcClient.sql("SELECT status FROM processing_job_layouts WHERE job_id = :id").param("id", job.id())
            .query(String.class).single()).isEqualTo("FAILED");
        var cancelled = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        ocrPersistence.claim(cancelled.jobRef(), now);
        transactionTemplate.executeWithoutResult(ignored -> repository.cancel(installation, cancelled.jobRef(), now));
        assertThat(ocrPersistence.completeWithLayout(cancelled.id(), "private/ocr/test.json", "a".repeat(64), now, failure)).isFalse();
        assertThat(jdbcClient.sql("SELECT count(*) FROM processing_job_layouts WHERE job_id = :id").param("id", cancelled.id())
            .query(Long.class).single()).isZero();
    }

    @Test
    void shouldClaimOcrOnlyOnceAndCommitStageWithJob() throws Exception {
        var installation = createInstallation();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        var job = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        Callable<OcrJobRepository.Claim> first = () -> ocrPersistence.claim(job.jobRef(), now);
        Callable<OcrJobRepository.Claim> second = () -> ocrPersistence.claim(job.jobRef(), now);
        List<OcrJobRepository.Claim> claims;
        try (var executor = Executors.newFixedThreadPool(2)) {
            claims = executor.invokeAll(List.of(first, second)).stream().map(future -> {
                try { return future.get(); } catch (Exception error) { throw new IllegalStateException(error); }
            }).toList();
        }
        assertThat(claims).containsExactlyInAnyOrder(OcrJobRepository.Claim.STARTED,
            OcrJobRepository.Claim.ALREADY_HANDLED);
        assertThat(ocrPersistence.complete(job.id(), "private/ocr/manifest.json", "a".repeat(64), now.plusSeconds(1)))
            .isTrue();
        assertThat(jdbcClient.sql("SELECT status FROM processing_jobs WHERE id = :id")
            .param("id", job.id()).query(String.class).single()).isEqualTo("TRANSLATING");
        assertThat(jdbcClient.sql("SELECT output_sha256 FROM processing_job_stages WHERE job_id = :id AND stage = 'OCR'")
            .param("id", job.id()).query(String.class).single()).isEqualTo("a".repeat(64));
        assertThatThrownBy(() -> transactionTemplate.executeWithoutResult(ignored ->
            jdbcClient.sql("UPDATE processing_job_stages SET output_sha256 = NULL WHERE job_id = :id AND stage = 'OCR'")
                .param("id", job.id()).update())).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void shouldClaimTranslationOnceAndCommitItsArtifactWithJob() throws Exception {
        var installation = createInstallation();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        var job = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        ocrPersistence.claim(job.jobRef(), now.plusSeconds(1));
        assertThat(ocrPersistence.complete(job.id(), "private/ocr/fixture.json", "a".repeat(64), now.plusSeconds(2))).isTrue();

        Callable<TranslationJobRepository.Claim> attempt = () -> translationPersistence.claim(job.jobRef(), now.plusSeconds(3));
        List<TranslationJobRepository.Claim> claims;
        try (var executor = Executors.newFixedThreadPool(2)) {
            claims = executor.invokeAll(List.of(attempt, attempt)).stream().map(future -> {
                try { return future.get(); } catch (Exception error) { throw new IllegalStateException(error); }
            }).toList();
        }
        assertThat(claims).containsExactlyInAnyOrder(TranslationJobRepository.Claim.STARTED,
            TranslationJobRepository.Claim.ALREADY_HANDLED);
        assertThatThrownBy(() -> transactionTemplate.executeWithoutResult(ignored -> {
            translationPersistence.complete(job.id(), "private/translation/fixture.json", "b".repeat(64), now.plusSeconds(4));
            throw new IllegalStateException("rollback");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(translationPersistence.find(job.jobRef()).status()).isEqualTo(JobStatus.TRANSLATING);

        assertThat(translationPersistence.complete(job.id(), "private/translation/fixture.json", "b".repeat(64),
            now.plusSeconds(5))).isTrue();
        var completed = translationPersistence.find(job.jobRef());
        assertThat(completed.status()).isEqualTo(JobStatus.RENDERING);
        assertThat(completed.translationSha256()).isEqualTo("b".repeat(64));
        assertThatThrownBy(() -> transactionTemplate.executeWithoutResult(ignored -> jdbcClient.sql("""
                UPDATE processing_job_stages SET output_sha256 = NULL
                WHERE job_id = :id AND stage = 'TRANSLATING'
                """).param("id", job.id()).update()))
            .isInstanceOf(DataIntegrityViolationException.class);
        jdbcClient.sql("DELETE FROM processing_jobs WHERE id = :id").param("id", job.id()).update();
        assertThat(jdbcClient.sql("SELECT count(*) FROM processing_job_stages WHERE job_id = :id")
            .param("id", job.id()).query(Long.class).single()).isZero();
    }

    @Test
    void shouldRejectAcknowledgementsOfAllNonReadyStates() {
        var installation = createInstallation();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        var job = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        for (var state : JobStatus.values()) {
            if (state == JobStatus.READY) continue;
            jdbcClient.sql("""
                    UPDATE processing_jobs SET status = :status,
                        error_code = CASE WHEN :status = 'FAILED' THEN 'ocr-unavailable' ELSE NULL END,
                        cancellation_requested_at = CASE WHEN :status IN ('CANCEL_PENDING', 'CANCELLED') THEN :now ELSE NULL END,
                        cancelled_at = CASE WHEN :status = 'CANCELLED' THEN :now ELSE NULL END
                    WHERE id = :id
                    """).param("status", state.name()).param("now", timestamp(now)).param("id", job.id()).update();
            assertThatThrownBy(() -> acknowledgeResult.execute(installation, job.jobRef()))
                .isInstanceOfSatisfying(GatewayException.class, error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.JOB_STATE_CONFLICT));
            assertThat(repository.findByJobRef(installation, job.jobRef()).orElseThrow().status()).isEqualTo(state);
        }
        assertThat(jdbcClient.sql("SELECT count(*) FROM processing_job_result_acknowledgements").query(Long.class).single()).isZero();
    }

    @Test
    void shouldRegisterAcknowledgementsOnceUnderConcurrencyAndKeepInstallationIsolation() throws Exception {
        var installation = createInstallation();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        var job = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        jdbcClient.sql("UPDATE processing_jobs SET status = 'READY' WHERE id = :id").param("id", job.id()).update();
        assertThatThrownBy(() -> acknowledgeResult.execute(createInstallation(), job.jobRef()))
            .isInstanceOfSatisfying(GatewayException.class, error -> assertThat(error.code()).isEqualTo(GatewayErrorCode.JOB_NOT_FOUND));
        Callable<Boolean> request = () -> { acknowledgeResult.execute(installation, job.jobRef()); return true; };
        try (var executor = Executors.newFixedThreadPool(2)) {
            for (var result : executor.invokeAll(List.of(request, request))) assertThat(result.get()).isTrue();
        }
        var first = jdbcClient.sql("SELECT requested_at FROM processing_job_result_acknowledgements WHERE job_id = :id")
            .param("id", job.id()).query(OffsetDateTime.class).single();
        acknowledgeResult.execute(installation, job.jobRef());
        assertThat(jdbcClient.sql("SELECT requested_at FROM processing_job_result_acknowledgements WHERE job_id = :id")
            .param("id", job.id()).query(OffsetDateTime.class).single()).isEqualTo(first);
        assertThat(repository.findByJobRef(installation, job.jobRef()).orElseThrow().status()).isEqualTo(JobStatus.RESULT_EXPIRED);
        assertThat(jdbcClient.sql("SELECT count(*) FROM processing_job_result_acknowledgements WHERE job_id = :id")
            .param("id", job.id()).query(Long.class).single()).isOne();
    }

    @Test
    void shouldRollbackAckWithJobAndEnforceItsConstraintsCascadeAndIndexes() {
        var installation = createInstallation();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        var job = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        jdbcClient.sql("UPDATE processing_jobs SET status = 'READY' WHERE id = :id").param("id", job.id()).update();
        assertThatThrownBy(() -> transactionTemplate.executeWithoutResult(ignored -> {
            acknowledgeResult.execute(installation, job.jobRef());
            throw new IllegalStateException("synthetic rollback");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(repository.findByJobRef(installation, job.jobRef()).orElseThrow().status()).isEqualTo(JobStatus.READY);
        assertThat(jdbcClient.sql("SELECT count(*) FROM processing_job_result_acknowledgements").query(Long.class).single()).isZero();
        acknowledgeResult.execute(installation, job.jobRef());
        assertThatThrownBy(() -> transactionTemplate.executeWithoutResult(ignored -> jdbcClient.sql("""
                UPDATE processing_job_result_acknowledgements SET completed_at = requested_at - interval '1 second'
                WHERE job_id = :id
                """).param("id", job.id()).update())).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> transactionTemplate.executeWithoutResult(ignored -> jdbcClient.sql("""
                INSERT INTO processing_job_result_acknowledgements (job_id, requested_at, next_attempt_at)
                VALUES (:id, :now, :now)
                """).param("id", UUID.randomUUID()).param("now", timestamp(now)).update()))
            .isInstanceOf(DataIntegrityViolationException.class);
        assertThat(jdbcClient.sql("SELECT count(*) FROM pg_indexes WHERE tablename = 'processing_job_result_acknowledgements'")
            .query(Long.class).single()).isEqualTo(2);
        jdbcClient.sql("DELETE FROM processing_jobs WHERE id = :id").param("id", job.id()).update();
        assertThat(jdbcClient.sql("SELECT count(*) FROM processing_job_result_acknowledgements").query(Long.class).single()).isZero();
    }

    @Test
    void shouldClaimAckCleanupConcurrentlyAndRejectStaleLeaseUpdates() throws Exception {
        var installation = createInstallation();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        for (int index = 0; index < 2; index++) {
            var job = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
            jdbcClient.sql("UPDATE processing_jobs SET status = 'READY' WHERE id = :id").param("id", job.id()).update();
            acknowledgeResult.execute(installation, job.jobRef());
        }
        var claimAt = Instant.now().truncatedTo(ChronoUnit.MILLIS).plusSeconds(1);
        var lease = claimAt.plusSeconds(300);
        Callable<List<ResultAcknowledgementRepository.CleanupClaim>> claim = () -> acknowledgementPersistence.claim(1, claimAt, lease);
        List<ResultAcknowledgementRepository.CleanupClaim> claims;
        try (var executor = Executors.newFixedThreadPool(2)) {
            var futures = executor.invokeAll(List.of(claim, claim));
            claims = List.of(futures.get(0).get().getFirst(), futures.get(1).get().getFirst());
        }
        assertThat(claims).extracting(ResultAcknowledgementRepository.CleanupClaim::jobId).doesNotHaveDuplicates();
        assertThat(acknowledgementPersistence.claim(100, claimAt, lease)).isEmpty();
        var newLease = lease.plusSeconds(301);
        var reclaimed = acknowledgementPersistence.claim(1, lease.plusSeconds(1), newLease).getFirst();
        assertThat(acknowledgementPersistence.complete(reclaimed.jobId(), lease, lease.plusSeconds(2))).isFalse();
        acknowledgementPersistence.reschedule(reclaimed.jobId(), lease, lease.plusSeconds(60));
        assertThat(jdbcClient.sql("SELECT next_attempt_at FROM processing_job_result_acknowledgements WHERE job_id = :id")
            .param("id", reclaimed.jobId()).query(OffsetDateTime.class).single().toInstant()).isEqualTo(newLease);
        assertThat(acknowledgementPersistence.complete(reclaimed.jobId(), newLease, lease.plusSeconds(3))).isTrue();
        assertThat(reclaimed.toString()).doesNotContain(reclaimed.jobId().toString(), "private/");
    }

    @ParameterizedTest
    @ValueSource(strings = {"success", "storage", "ack-lost", "ttl", "ttl-storage"})
    void shouldCleanOnlyAckArtifactsOutsideTransactionsAndRecoverPartialFailure(String scenario) throws Exception {
        boolean storageFailure = scenario.equals("storage") || scenario.equals("ttl-storage");
        var installation = createInstallation();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        var job = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        var otherJob = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        var originalKey = jdbcClient.sql("SELECT original_object_key FROM processing_jobs WHERE id = :id")
            .param("id", job.id()).query(String.class).single();
        var otherKey = jdbcClient.sql("SELECT original_object_key FROM processing_jobs WHERE id = :id")
            .param("id", otherJob.id()).query(String.class).single();
        var ocrKey = "private/ocr/ack.json";
        var translationKey = "private/translation/ack.json";
        var layoutKey = "private/layout/ack.json";
        var renderKey = "private/render/ack.webp";
        var renderManifestKey = "private/render/ack.json";
        ocrPersistence.claim(job.jobRef(), now);
        ocrPersistence.complete(job.id(), ocrKey, "a".repeat(64), now);
        translationPersistence.claim(job.jobRef(), now);
        translationPersistence.complete(job.id(), translationKey, "b".repeat(64), now);
        jdbcClient.sql("""
                INSERT INTO processing_job_layouts (job_id, status, output_object_key, output_sha256, started_at, completed_at)
                VALUES (:id, 'SUCCEEDED', :key, :hash, :now, :now)
                """).param("id", job.id()).param("key", layoutKey).param("hash", "c".repeat(64)).param("now", timestamp(now)).update();
        jdbcClient.sql("""
                INSERT INTO processing_job_stages (job_id, stage, status, started_at, completed_at, output_object_key, output_sha256,
                    rendered_image_object_key, rendered_image_sha256, rendered_image_byte_size, result_expires_at)
                VALUES (:id, 'RENDERING', 'SUCCEEDED', :now, :now, :manifest, :hash, :key, :hash, 1024, :now + INTERVAL '1 hour')
                """).param("id", job.id()).param("key", renderKey).param("manifest", renderManifestKey)
            .param("hash", "d".repeat(64)).param("now", timestamp(now)).update();
        jdbcClient.sql("UPDATE processing_jobs SET status = 'READY' WHERE id = :id").param("id", job.id()).update();
        var properties = new GatewayProperties();
        properties.getStorage().setLocalDirectory(workerTemporary);
        var storage = spy(new LocalObjectStorageAdapter(properties));
        var source = workerTemporary.resolve("synthetic-ack-source");
        Files.writeString(source, "synthetic artifact bytes");
        var hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(source)));
        for (var key : List.of(originalKey, ocrKey, translationKey, layoutKey, renderKey, renderManifestKey, otherKey)) {
            storage.store(key, source, "application/json", hash, now);
        }
        doAnswer(call -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            if (storageFailure && translationKey.equals(call.getArgument(0))) throw new IllegalStateException("synthetic storage failure");
            return call.callRealMethod();
        }).when(storage).delete(any());
        if (scenario.startsWith("ttl")) {
            transactionTemplate.executeWithoutResult(ignored ->
                assertThat(acknowledgementRepository.expire(installation, job.jobRef(), now.plusSeconds(3600), now)).isTrue());
        } else {
            acknowledgeResult.execute(installation, job.jobRef());
        }
        var cleanupPersistence = mock(ResultAcknowledgementPersistenceUseCase.class,
            withSettings().defaultAnswer(delegatesTo(acknowledgementPersistence)));
        if (scenario.equals("ack-lost")) {
            doAnswer(call -> {
                acknowledgementPersistence.complete(call.getArgument(0), call.getArgument(1), call.getArgument(2));
                throw new IllegalStateException("synthetic lost cleanup confirmation");
            }).when(cleanupPersistence).complete(any(), any(), any());
        }
        var runAt = scenario.startsWith("ttl") ? now.plusSeconds(3601)
            : Instant.now().truncatedTo(ChronoUnit.MILLIS).plusSeconds(1);
        var cleanup = new CleanupAcknowledgedResultsUseCase(cleanupPersistence, storage, Clock.fixed(runAt, ZoneOffset.UTC));
        boolean deferred = storageFailure || scenario.equals("ack-lost");
        assertThat(cleanup.execute()).isEqualTo(new CleanupAcknowledgedResultsUseCase.Result(deferred ? 0 : 1, deferred ? 1 : 0));
        if (storageFailure) {
            assertThat(Files.exists(workerTemporary.resolve(translationKey))).isTrue();
            doAnswer(call -> call.callRealMethod()).when(storage).delete(any());
            var retry = new CleanupAcknowledgedResultsUseCase(acknowledgementPersistence, storage, Clock.fixed(runAt.plusSeconds(61), ZoneOffset.UTC));
            assertThat(retry.execute()).isEqualTo(new CleanupAcknowledgedResultsUseCase.Result(1, 0));
        }
        for (var key : List.of(originalKey, ocrKey, translationKey, layoutKey, renderKey, renderManifestKey)) {
            assertThat(Files.exists(workerTemporary.resolve(key))).isFalse();
        }
        assertThat(Files.readString(workerTemporary.resolve(otherKey))).isEqualTo("synthetic artifact bytes");
        acknowledgeResult.execute(installation, job.jobRef());
        assertThat(cleanup.execute()).isEqualTo(new CleanupAcknowledgedResultsUseCase.Result(0, 0));
        assertThat(jdbcClient.sql("SELECT completed_at IS NOT NULL FROM processing_job_result_acknowledgements WHERE job_id = :id")
            .param("id", job.id()).query(Boolean.class).single()).isTrue();
        assertThat(repository.findByJobRef(installation, job.jobRef()).orElseThrow().status()).isEqualTo(JobStatus.RESULT_EXPIRED);
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void shouldKeepTranslationOwnerRunningWhenRedeliveryCannotReadInput(boolean cancel) throws Exception {
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        var installation = createInstallation();
        var job = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        var properties = new GatewayProperties();
        properties.getTranslation().setMode(GatewayProperties.Translation.Mode.GOOGLE);
        properties.getTranslation().setEnabledPairs(List.of("ja:pt-BR"));
        properties.getStorage().setLocalDirectory(workerTemporary);
        var storage = spy(new LocalObjectStorageAdapter(properties));
        var mapper = GatewayJsonMapper.create();
        var manifests = new OcrManifestService(mapper);
        var regionId = UUID.randomUUID();
        var encoded = manifests.encode(new OcrManifest("1.0", job.jobRef(), "ja", 100, 200, List.of(
            new OcrManifest.Region(regionId, 0, "synthetic source", List.of(new OcrManifest.Vertex(0, 0),
                new OcrManifest.Vertex(1, 0), new OcrManifest.Vertex(1, 1), new OcrManifest.Vertex(0, 1))))));
        var source = workerTemporary.resolve("ocr-fixture.json");
        Files.write(source, encoded.bytes());
        var ocrKey = "private/ocr/" + job.id() + ".json";
        storage.store(ocrKey, source, "application/json", encoded.sha256(), now);
        ocrPersistence.claim(job.jobRef(), now);
        ocrPersistence.complete(job.id(), ocrKey, encoded.sha256(), now);
        var reads = new AtomicInteger();
        doAnswer(call -> {
            if (reads.incrementAndGet() > 1) {
                if (cancel) transactionTemplate.executeWithoutResult(ignored -> repository.cancel(installation, job.jobRef(), Instant.now()));
                throw new GatewayException(GatewayErrorCode.STORAGE_UNAVAILABLE, 503, true);
            }
            return call.callRealMethod();
        }).when(storage).open(eq(ocrKey));
        var started = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var calls = new AtomicInteger();
        var worker = new ProcessTranslationTaskUseCase(translationPersistence, storage, manifests,
            new TranslationManifestService(mapper), request -> {
                calls.incrementAndGet();
                assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
                started.countDown();
                try { assertThat(release.await(10, TimeUnit.SECONDS)).isTrue(); }
                catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new IllegalStateException("test interrupted"); }
                return new TranslationResponse(List.of(new TranslationResponse.Region(regionId, "synthetic target")));
            }, properties, Clock.systemUTC(),
            new CleanupLifecycleObjectsUseCase(lifecyclePersistence, storage, Clock.systemUTC()));
        try (var executor = Executors.newSingleThreadExecutor()) {
            var first = executor.submit(() -> worker.execute(job.jobRef()));
            try {
                assertThat(started.await(10, TimeUnit.SECONDS)).isTrue();
                worker.execute(job.jobRef());
                assertThat(translationPersistence.find(job.jobRef()).status()).isEqualTo(cancel ? JobStatus.CANCEL_PENDING : JobStatus.TRANSLATING);
                assertThat(jdbcClient.sql("SELECT status FROM processing_job_stages WHERE job_id = :id AND stage = 'TRANSLATING'")
                    .param("id", job.id()).query(String.class).single()).isEqualTo("RUNNING");
            } finally { release.countDown(); }
            first.get(10, TimeUnit.SECONDS);
        }
        worker.execute(job.jobRef());
        assertThat(calls).hasValue(1);
        var result = translationPersistence.find(job.jobRef());
        assertThat(result.status()).isEqualTo(cancel ? JobStatus.CANCELLED : JobStatus.RENDERING);
        if (cancel) {
            try (var paths = Files.walk(workerTemporary.resolve("private/translation"))) {
                assertThat(paths.filter(Files::isRegularFile)).isEmpty();
            }
        } else {
            var bytes = Files.readAllBytes(workerTemporary.resolve(result.translationObjectKey()));
            assertThat(HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes))).isEqualTo(result.translationSha256());
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"success", "invalid", "unavailable", "timeout", "rollback", "ack-lost", "cancel", "storage"})
    void shouldProcessTranslationThroughGrpcAndPostgresWithoutRepeatingTheCall(String scenario) throws Exception {
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        var installation = createInstallation();
        var job = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        var properties = new GatewayProperties();
        properties.getTranslation().setMode(GatewayProperties.Translation.Mode.GOOGLE);
        properties.getTranslation().setEnabledPairs(List.of("ja:pt-BR"));
        properties.getStorage().setLocalDirectory(workerTemporary);
        var storage = spy(new LocalObjectStorageAdapter(properties));
        var mapper = GatewayJsonMapper.create();
        var ocrManifests = new OcrManifestService(mapper);
        var translationManifests = new TranslationManifestService(mapper);
        var region = new OcrManifest.Region(UUID.randomUUID(), 0, "synthetic 漢字 <opaque>", List.of(
            new OcrManifest.Vertex(0, 0), new OcrManifest.Vertex(1, 0),
            new OcrManifest.Vertex(1, 1), new OcrManifest.Vertex(0, 1)));
        var encoded = ocrManifests.encode(new OcrManifest("1.0", job.jobRef(), "ja", 100, 200, List.of(region)));
        var source = workerTemporary.resolve("grpc-ocr.json");
        Files.write(source, encoded.bytes());
        var ocrKey = "private/ocr/" + job.id() + ".json";
        storage.store(ocrKey, source, "application/json", encoded.sha256(), now);
        ocrPersistence.claim(job.jobRef(), now);
        ocrPersistence.complete(job.id(), ocrKey, encoded.sha256(), now);
        var persistence = mock(TranslationPersistenceUseCase.class, withSettings().defaultAnswer(delegatesTo(translationPersistence)));
        if (scenario.equals("rollback") || scenario.equals("ack-lost")) {
            doAnswer(call -> {
                if (scenario.equals("rollback")) {
                    transactionTemplate.executeWithoutResult(ignored -> {
                        translationPersistence.complete(call.getArgument(0), call.getArgument(1), call.getArgument(2), call.getArgument(3));
                        throw new IllegalStateException("synthetic commit rollback");
                    });
                } else {
                    translationPersistence.complete(call.getArgument(0), call.getArgument(1), call.getArgument(2), call.getArgument(3));
                    throw new IllegalStateException("synthetic lost commit confirmation");
                }
                return false;
            }).when(persistence).complete(any(), any(), any(), any());
        }
        if (scenario.equals("storage")) {
            doThrow(new GatewayException(GatewayErrorCode.STORAGE_UNAVAILABLE, 503, true))
                .when(storage).store(argThat(key -> key.startsWith("private/translation/")), any(), any(), any(), any());
        }
        try (var server = new FakeTranslationServer();
             var adapter = new CloudTranslationAdapter(server.client(scenario.equals("timeout")
                 ? Duration.ofSeconds(1) : Duration.ofSeconds(5)), "test-project")) {
            server.handler = (request, observer) -> {
                if (scenario.equals("timeout")) return;
                if (scenario.equals("unavailable")) {
                    observer.onError(Status.UNAVAILABLE.withDescription("synthetic private response").asRuntimeException());
                    return;
                }
                if (scenario.equals("cancel")) {
                    transactionTemplate.executeWithoutResult(ignored -> repository.cancel(installation, job.jobRef(), Instant.now()));
                }
                var response = TranslateTextResponse.newBuilder();
                response.addTranslationsBuilder().setModel(request.getModel())
                    .setTranslatedText(scenario.equals("invalid") ? "<div></div>" : request.getContents(0));
                observer.onNext(response.build());
                observer.onCompleted();
            };
            var worker = new ProcessTranslationTaskUseCase(persistence, storage, ocrManifests, translationManifests,
                request -> {
                    assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
                    return adapter.translate(request);
                }, properties, Clock.systemUTC(),
                new CleanupLifecycleObjectsUseCase(lifecyclePersistence, storage, Clock.systemUTC()));
            worker.execute(job.jobRef());
            worker.execute(job.jobRef());
            assertThat(server.calls).hasValue(1);
            assertThat(server.lastRequest.getContentsCount()).isOne();
            assertThat(server.lastRequest.getTargetLanguageCode()).isEqualTo("pt-BR");
            var completed = translationPersistence.find(job.jobRef());
            boolean success = scenario.equals("success") || scenario.equals("ack-lost");
            assertThat(completed.status()).isEqualTo(success ? JobStatus.RENDERING
                : scenario.equals("cancel") ? JobStatus.CANCELLED : JobStatus.FAILED);
            assertThat(jdbcClient.sql("SELECT status FROM processing_job_stages WHERE job_id = :id AND stage = 'TRANSLATING'")
                .param("id", job.id()).query(String.class).single())
                .isEqualTo(success ? "SUCCEEDED" : scenario.equals("cancel") ? "CANCELLED" : "FAILED");
            if (success) {
                var bytes = Files.readAllBytes(workerTemporary.resolve(completed.translationObjectKey()));
                var request = new TranslationRequest(job.jobRef(), new LanguagePair("ja", "pt-BR"), List.of(
                    new TranslationRequest.Region(region.id(), 0, region.sourceText())));
                var result = translationManifests.decode(bytes, completed.translationSha256(), request, encoded.sha256());
                assertThat(result.regions().getFirst().translatedText()).isEqualTo(region.sourceText());
                assertThat(result.regions().getFirst().id()).isEqualTo(region.id());
            } else {
                assertThat(completed.translationObjectKey()).isNull();
                assertThat(completed.translationSha256()).isNull();
                var error = jdbcClient.sql("SELECT error_code FROM processing_jobs WHERE id = :id")
                    .param("id", job.id()).query(String.class).optional();
                if (!scenario.equals("cancel")) {
                    assertThat(error).contains(scenario.equals("invalid")
                        ? "translation-invalid-response" : "translation-unavailable");
                }
                var translationDirectory = workerTemporary.resolve("private/translation");
                if (Files.exists(translationDirectory)) {
                    try (var paths = Files.walk(translationDirectory)) {
                        assertThat(paths.filter(Files::isRegularFile)).isEmpty();
                    }
                }
            }
            if (success) assertThat(Files.readAllBytes(workerTemporary.resolve(ocrKey))).isEqualTo(encoded.bytes());
            else assertThat(Files.exists(workerTemporary.resolve(ocrKey))).isFalse();
        }
    }

    @RepeatedTest(4)
    void shouldSerializeTranslationClaimAgainstUnclaimedFailure() throws Exception {
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        var installation = createInstallation();
        var job = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        ocrPersistence.claim(job.jobRef(), now);
        ocrPersistence.complete(job.id(), "private/ocr/fixture.json", "a".repeat(64), now);
        var ready = new CountDownLatch(2);
        var start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var claim = executor.submit(() -> {
                ready.countDown();
                assertThat(start.await(10, TimeUnit.SECONDS)).isTrue();
                return translationPersistence.claim(job.jobRef(), now.plusSeconds(1));
            });
            var failure = executor.submit(() -> {
                ready.countDown();
                assertThat(start.await(10, TimeUnit.SECONDS)).isTrue();
                translationPersistence.failUnclaimed(job.id(), GatewayErrorCode.TRANSLATION_INVALID_REQUEST, now.plusSeconds(2));
                return true;
            });
            try { assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue(); }
            finally { start.countDown(); }
            var result = claim.get(10, TimeUnit.SECONDS);
            failure.get(10, TimeUnit.SECONDS);
            boolean claimed = result == TranslationJobRepository.Claim.STARTED;
            assertThat(translationPersistence.find(job.jobRef()).status()).isEqualTo(claimed ? JobStatus.TRANSLATING : JobStatus.FAILED);
            assertThat(jdbcClient.sql("SELECT status FROM processing_job_stages WHERE job_id = :id AND stage = 'TRANSLATING'")
                .param("id", job.id()).query(String.class).single()).isEqualTo(claimed ? "RUNNING" : "FAILED");
        }
    }

    @Test
    void shouldPersistUnclaimedFailureAtomicallyWithoutMutatingAnOwnedOrCompletedStage() {
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        var installation = createInstallation();
        var job = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        ocrPersistence.claim(job.jobRef(), now);
        ocrPersistence.complete(job.id(), "private/ocr/fixture.json", "a".repeat(64), now);
        assertThatThrownBy(() -> transactionTemplate.executeWithoutResult(ignored -> {
            translationPersistence.failUnclaimed(job.id(), GatewayErrorCode.TRANSLATION_INVALID_REQUEST, now.plusSeconds(1));
            throw new IllegalStateException("injected rollback");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(translationPersistence.find(job.jobRef()).status()).isEqualTo(JobStatus.TRANSLATING);
        assertThat(jdbcClient.sql("SELECT count(*) FROM processing_job_stages WHERE job_id = :id AND stage = 'TRANSLATING'")
            .param("id", job.id()).query(Long.class).single()).isZero();
        assertThat(translationPersistence.claim(job.jobRef(), now.plusSeconds(2))).isEqualTo(TranslationJobRepository.Claim.STARTED);
        translationPersistence.failUnclaimed(job.id(), GatewayErrorCode.TRANSLATION_INVALID_REQUEST, now.plusSeconds(3));
        assertThat(translationPersistence.find(job.jobRef()).status()).isEqualTo(JobStatus.TRANSLATING);
        assertThat(jdbcClient.sql("SELECT started_at FROM processing_job_stages WHERE job_id = :id AND stage = 'TRANSLATING'")
            .param("id", job.id()).query(OffsetDateTime.class).single().toInstant()).isEqualTo(now.plusSeconds(2));
        assertThat(translationPersistence.complete(job.id(), "private/translation/fixture.json", "b".repeat(64), now.plusSeconds(4))).isTrue();
        var completed = translationPersistence.find(job.jobRef());
        translationPersistence.failUnclaimed(job.id(), GatewayErrorCode.TRANSLATION_UNAVAILABLE, now.plusSeconds(5));
        assertThat(translationPersistence.find(job.jobRef())).isEqualTo(completed);

        var invalid = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        ocrPersistence.claim(invalid.jobRef(), now);
        ocrPersistence.complete(invalid.id(), "private/ocr/invalid.json", "a".repeat(64), now);
        translationPersistence.failUnclaimed(invalid.id(), GatewayErrorCode.TRANSLATION_INVALID_REQUEST, now.plusSeconds(1));
        translationPersistence.failUnclaimed(invalid.id(), GatewayErrorCode.TRANSLATION_UNAVAILABLE, now.plusSeconds(2));
        assertThat(translationPersistence.find(invalid.jobRef()).status()).isEqualTo(JobStatus.FAILED);
        assertThat(jdbcClient.sql("SELECT error_code FROM processing_jobs WHERE id = :id").param("id", invalid.id())
            .query(String.class).single()).isEqualTo(GatewayErrorCode.TRANSLATION_INVALID_REQUEST.value());
        assertThat(translationPersistence.claim(invalid.jobRef(), now.plusSeconds(3))).isEqualTo(TranslationJobRepository.Claim.ALREADY_HANDLED);
    }

    @Test
    void shouldCancelTranslationAtSafeBoundaryAndFailAbandonedRunningStage() {
        var installation = createInstallation();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        var ocrRunning = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        ocrPersistence.claim(ocrRunning.jobRef(), now.plusSeconds(1));
        repository.cancel(installation, ocrRunning.jobRef(), now.plusSeconds(2));
        assertThat(translationPersistence.claim(ocrRunning.jobRef(), now.plusSeconds(3)))
            .isEqualTo(TranslationJobRepository.Claim.ALREADY_HANDLED);
        assertThat(translationPersistence.find(ocrRunning.jobRef()).status()).isEqualTo(JobStatus.CANCEL_PENDING);
        assertThat(ocrPersistence.complete(ocrRunning.id(), "private/ocr/discard.json", "a".repeat(64),
            now.plusSeconds(4))).isFalse();
        var cancelled = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        ocrPersistence.claim(cancelled.jobRef(), now.plusSeconds(1));
        ocrPersistence.complete(cancelled.id(), "private/ocr/cancel.json", "a".repeat(64), now.plusSeconds(2));
        translationPersistence.claim(cancelled.jobRef(), now.plusSeconds(3));
        repository.cancel(installation, cancelled.jobRef(), now.plusSeconds(4));
        assertThat(ocrPersistence.claim(cancelled.jobRef(), now.plusSeconds(4)))
            .isEqualTo(OcrJobRepository.Claim.ALREADY_HANDLED);
        assertThat(translationPersistence.find(cancelled.jobRef()).status()).isEqualTo(JobStatus.CANCEL_PENDING);
        assertThat(translationPersistence.complete(cancelled.id(), "private/translation/discard.json", "b".repeat(64),
            now.plusSeconds(5))).isFalse();
        assertThat(translationPersistence.find(cancelled.jobRef()).status()).isEqualTo(JobStatus.CANCELLED);

        var stale = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        ocrPersistence.claim(stale.jobRef(), now.plusSeconds(1));
        ocrPersistence.complete(stale.id(), "private/ocr/stale.json", "a".repeat(64), now.plusSeconds(2));
        translationPersistence.claim(stale.jobRef(), now.plusSeconds(3));
        assertThat(translationPersistence.failStale(now.plusSeconds(4), now.plusSeconds(904), 100)).isOne();
        assertThat(translationPersistence.find(stale.jobRef()).status()).isEqualTo(JobStatus.FAILED);
        assertThat(translationPersistence.claim(stale.jobRef(), now.plusSeconds(905)))
            .isEqualTo(TranslationJobRepository.Claim.ALREADY_HANDLED);
    }

    @Test
    void shouldCancelOcrBeforeCommitAndExpireAbandonedCalls() {
        var installation = createInstallation();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        var cancelled = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        ocrPersistence.claim(cancelled.jobRef(), now.plusSeconds(1));
        repository.cancel(installation, cancelled.jobRef(), now.plusSeconds(2));
        assertThat(ocrPersistence.complete(cancelled.id(), "private/ocr/cancelled.json", "a".repeat(64), now.plusSeconds(3)))
            .isFalse();
        assertThat(jdbcClient.sql("SELECT status FROM processing_jobs WHERE id = :id")
            .param("id", cancelled.id()).query(String.class).single()).isEqualTo("CANCELLED");

        var stale = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        ocrPersistence.claim(stale.jobRef(), now.plusSeconds(1));
        assertThat(ocrPersistence.failStale(now.plusSeconds(902), now.plusSeconds(903), 100)).hasSize(1);
        assertThat(jdbcClient.sql("SELECT status FROM processing_jobs WHERE id = :id")
            .param("id", stale.id()).query(String.class).single()).isEqualTo("FAILED");
    }

    @Test
    void shouldRollbackOcrArtifactAndStatusTogether() {
        var installation = createInstallation();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        var job = reserveJob.execute(candidate(installation, UUID.randomUUID(), UUID.randomUUID(), now)).job();
        ocrPersistence.claim(job.jobRef(), now.plusSeconds(1));
        assertThatThrownBy(() -> transactionTemplate.executeWithoutResult(ignored -> {
            ocrRepository.complete(job.id(), "private/ocr/rolled-back.json", "b".repeat(64), now.plusSeconds(2));
            throw new IllegalStateException("rollback");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(jdbcClient.sql("SELECT status FROM processing_jobs WHERE id = :id")
            .param("id", job.id()).query(String.class).single()).isEqualTo("OCR");
        assertThat(jdbcClient.sql("SELECT status FROM processing_job_stages WHERE job_id = :id AND stage = 'OCR'")
            .param("id", job.id()).query(String.class).single()).isEqualTo("RUNNING");
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void shouldRunWorkerThroughVisionOnlyOnceUnderRedeliveryAndCancellation(boolean cancel) throws Exception {
        var prepared = prepareWorkerJob();
        var entered = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        try (var server = new FakeVisionServer();
             var adapter = new VisionOcrAdapter(server.client(Duration.ofSeconds(10)), "test-project", "private-fixtures");
             var executor = Executors.newSingleThreadExecutor()) {
            var defaultHandler = server.handler;
            server.handler = (request, observer) -> {
                entered.countDown();
                try {
                    if (!release.await(5, TimeUnit.SECONDS)) throw new IllegalStateException("test timeout");
                    defaultHandler.accept(request, observer);
                } catch (InterruptedException error) {
                    Thread.currentThread().interrupt();
                    observer.onError(error);
                }
            };
            var worker = worker(prepared, ocrPersistence, prepared.storage(), adapter);
            var first = executor.submit(() -> worker.execute(prepared.job().jobRef()));
            try {
                assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue();
                worker.execute(prepared.job().jobRef());
                if (cancel) {
                    transactionTemplate.executeWithoutResult(ignored -> repository.cancel(
                        prepared.installation(), prepared.job().jobRef(), Instant.now()));
                    worker.execute(prepared.job().jobRef());
                    assertThat(ocrPersistence.find(prepared.job().jobRef()).status()).isEqualTo(JobStatus.CANCEL_PENDING);
                    assertThat(Files.exists(workerTemporary.resolve(prepared.job().objectKey()))).isTrue();
                }
            } finally {
                release.countDown();
            }
            first.get(10, TimeUnit.SECONDS);
            worker.execute(prepared.job().jobRef());
            assertThat(server.calls).hasValue(1);
            assertThat(ocrPersistence.find(prepared.job().jobRef()).status())
                .isEqualTo(cancel ? JobStatus.CANCELLED : JobStatus.TRANSLATING);
            assertThat(Files.exists(workerTemporary.resolve(prepared.job().objectKey()))).isEqualTo(!cancel);
            if (!cancel) assertManifestIntegrity(prepared.job().id());
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = {false, true})
    void shouldHandleRealTransactionRollbackOrLostCommitAckWithoutAnotherRpc(boolean ackLost) throws Exception {
        var prepared = prepareWorkerJob();
        var injected = mock(OcrPersistenceUseCase.class, withSettings().defaultAnswer(delegatesTo(ocrPersistence)));
        doAnswer(call -> {
            UUID id = call.getArgument(0);
            String key = call.getArgument(1);
            String sha = call.getArgument(2);
            Instant now = call.getArgument(3);
            if (ackLost) ocrPersistence.complete(id, key, sha, now);
            else transactionTemplate.executeWithoutResult(ignored -> {
                ocrRepository.complete(id, key, sha, now);
                throw new IllegalStateException("injected rollback");
            });
            throw new IllegalStateException("injected acknowledgement loss");
        }).when(injected).complete(any(), any(), any(), any());
        try (var server = new FakeVisionServer();
             var adapter = new VisionOcrAdapter(server.client(Duration.ofSeconds(5)), "test-project", "private-fixtures")) {
            var worker = worker(prepared, injected, prepared.storage(), adapter);
            worker.execute(prepared.job().jobRef());
            worker.execute(prepared.job().jobRef());
            assertThat(server.calls).hasValue(1);
            assertThat(ocrPersistence.find(prepared.job().jobRef()).status()).isEqualTo(ackLost ? JobStatus.TRANSLATING : JobStatus.FAILED);
            if (ackLost) assertManifestIntegrity(prepared.job().id());
            else try (var files = Files.walk(workerTemporary)) { assertThat(files.filter(Files::isRegularFile).count()).isZero(); }
        }
    }

    @Test
    void shouldFailManifestStorageWithoutRetryingVision() throws Exception {
        var prepared = prepareWorkerJob();
        var failingStorage = spy(prepared.storage());
        doThrow(new IllegalStateException("injected upload failure")).when(failingStorage)
            .store(argThat(key -> key.startsWith("private/ocr/")), any(), any(), any(), any());
        try (var server = new FakeVisionServer();
             var adapter = new VisionOcrAdapter(server.client(Duration.ofSeconds(5)), "test-project", "private-fixtures")) {
            var worker = worker(prepared, ocrPersistence, failingStorage, adapter);
            worker.execute(prepared.job().jobRef());
            worker.execute(prepared.job().jobRef());
            assertThat(server.calls).hasValue(1);
            assertThat(ocrPersistence.find(prepared.job().jobRef()).status()).isEqualTo(JobStatus.FAILED);
        }
    }

    private PreparedWorker prepareWorkerJob() throws Exception {
        var properties = new GatewayProperties();
        properties.getStorage().setLocalDirectory(workerTemporary);
        var storage = new LocalObjectStorageAdapter(properties);
        var source = workerTemporary.resolve("source.png");
        ImageIO.write(new BufferedImage(100, 200, BufferedImage.TYPE_INT_RGB), "png", source.toFile());
        var inspector = new MediaInspectionService();
        try (var input = Files.newInputStream(source)) {
            var media = inspector.inspect(input, properties.getMedia().getMaxBytes());
            try {
                var installation = createInstallation();
                var now = Instant.now();
                var key = "private/originals/" + UUID.randomUUID();
                storage.store(key, media.path(), media.mimeType(), media.sha256(), now);
                var job = reserveJob.execute(new GatewayRepository.NewJob(UUID.randomUUID(), UUID.randomUUID(), installation,
                    UUID.randomUUID(), UUID.randomUUID(), "fixture", "ja", "pt-BR", media.mimeType(), media.byteSize(),
                    media.widthPx(), media.heightPx(), key, media.sha256(), "a".repeat(64), now, now.plus(7, ChronoUnit.DAYS))).job();
                transactionTemplate.executeWithoutResult(ignored -> {
                    var claim = repository.claimDispatches(1, now, now.plusSeconds(60)).getFirst();
                    assertThat(claim.jobId()).isEqualTo(job.id());
                    assertThat(repository.markDispatched(job.id(), claim.attemptCount(), now)).isTrue();
                });
                return new PreparedWorker(installation, ocrPersistence.find(job.jobRef()), properties, storage);
            } finally { inspector.deleteQuietly(media.path()); }
        } finally { Files.deleteIfExists(source); }
    }

    private ProcessOcrTaskUseCase worker(PreparedWorker prepared, OcrPersistenceUseCase persistence,
                                        LocalObjectStorageAdapter storage, VisionOcrAdapter adapter) {
        return new ProcessOcrTaskUseCase(persistence, storage, new MediaInspectionService(), adapter,
            new OcrManifestService(GatewayJsonMapper.create()), prepared.properties(), Clock.systemUTC(),
            new CleanupLifecycleObjectsUseCase(lifecyclePersistence, storage, Clock.systemUTC()));
    }

    private void assertManifestIntegrity(UUID jobId) throws Exception {
        var result = jdbcClient.sql("SELECT output_object_key, output_sha256, status FROM processing_job_stages WHERE job_id = :id AND stage = 'OCR'")
            .param("id", jobId).query().singleRow();
        assertThat(result.get("status")).isEqualTo("SUCCEEDED");
        var bytes = Files.readAllBytes(workerTemporary.resolve((String) result.get("output_object_key")));
        assertThat(HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes))).isEqualTo(result.get("output_sha256"));
        assertThat(GatewayJsonMapper.create().readTree(bytes).get("sourceLanguage").asText()).isEqualTo("ja");
    }

    private record PreparedWorker(UUID installation, OcrJobRepository.WorkItem job, GatewayProperties properties,
                                  LocalObjectStorageAdapter storage) { }

    private UUID insertJob(UUID installationId, UUID idempotencyKey, UUID attemptRef, Instant createdAt) {
        var jobId = UUID.randomUUID();
        jdbcClient.sql("""
                INSERT INTO processing_jobs
                    (id, job_ref, installation_id, idempotency_key, attempt_ref,
                     gateway_contract_version, disclosure_version, source_language,
                     target_language, original_mime_type, original_byte_size,
                     width_px, height_px, status, original_object_key, original_sha256,
                     request_fingerprint, created_at,
                     updated_at, accepted_at, metadata_expires_at)
                VALUES
                    (:id, :jobRef, :installationId, :idempotencyKey, :attemptRef,
                     '1.0', 'privacy-2026-09', 'ja', 'pt-BR', 'image/png', 1024,
                     100, 200, 'QUEUED', :objectKey, :hash, :hash, :createdAt, :createdAt,
                     :createdAt, :expiresAt)
                """)
            .param("id", jobId)
            .param("jobRef", UUID.randomUUID())
            .param("installationId", installationId)
            .param("idempotencyKey", idempotencyKey)
            .param("attemptRef", attemptRef)
            .param("objectKey", "private/originals/" + jobId)
            .param("hash", "0".repeat(64))
            .param("createdAt", timestamp(createdAt))
            .param("expiresAt", timestamp(createdAt.plus(7, ChronoUnit.DAYS)))
            .update();
        return jobId;
    }

    private UUID createInstallation() {
        var installationId = UUID.randomUUID();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        jdbcClient.sql("""
                INSERT INTO anonymous_installations (id, credential_hash, status, created_at, last_seen_at)
                VALUES (:id, :hash, 'ACTIVE', :now, :now)
                """).param("id", installationId).param("hash", "argon2id:" + installationId)
            .param("now", timestamp(now)).update();
        return installationId;
    }

    private GatewayRepository.NewJob candidate(UUID installationId, UUID idempotencyKey, UUID attemptRef, Instant now) {
        return new GatewayRepository.NewJob(UUID.randomUUID(), UUID.randomUUID(), installationId, idempotencyKey, attemptRef,
            "privacy-2026-09", "ja", "pt-BR", "image/png", 1024, 100, 200,
            "private/originals/" + UUID.randomUUID(), "0".repeat(64), "1".repeat(64), now, now.plus(7, ChronoUnit.DAYS));
    }

    private boolean tableExists(String tableName) {
        return Boolean.TRUE.equals(jdbcClient.sql("SELECT to_regclass(:tableName) IS NOT NULL")
            .param("tableName", tableName)
            .query(Boolean.class)
            .single());
    }

    private int countDispatches(UUID jobId) {
        return jdbcClient.sql("SELECT COUNT(*) FROM processing_job_dispatches WHERE job_id = :jobId")
            .param("jobId", jobId)
            .query(Integer.class)
            .single();
    }

    private OffsetDateTime timestamp(Instant value) {
        return OffsetDateTime.ofInstant(value, ZoneOffset.UTC);
    }
}
