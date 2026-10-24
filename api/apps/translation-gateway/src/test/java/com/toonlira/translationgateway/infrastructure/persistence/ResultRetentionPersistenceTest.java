package com.toonlira.translationgateway.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import com.toonlira.translationgateway.application.GetJobResultUseCase;
import com.toonlira.translationgateway.application.OcrPersistenceUseCase;
import com.toonlira.translationgateway.application.RenderingPersistenceUseCase;
import com.toonlira.translationgateway.application.ReserveJobUseCase;
import com.toonlira.translationgateway.application.TranslationPersistenceUseCase;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.application.port.PrivateDownloadPort;
import com.toonlira.translationgateway.application.port.RenderingJobRepository;
import com.toonlira.translationgateway.application.port.ResultDownloadRepository;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.ProcessingJob;
import com.toonlira.translationgateway.domain.rendering.PrivateDownload;
import com.toonlira.translationgateway.domain.rendering.PrivateDownloadRequest;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import com.toonlira.translationgateway.domain.rendering.ResultObjectKey;
import com.toonlira.translationgateway.domain.rendering.RenderValidationException;
import java.net.URI;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Tag("testcontainers")
@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class ResultRetentionPersistenceTest {
    @Container static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");
    @DynamicPropertySource static void database(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", POSTGRES::getJdbcUrl); r.add("spring.datasource.username", POSTGRES::getUsername);
        r.add("spring.datasource.password", POSTGRES::getPassword);
    }
    @Autowired GatewayRepository gateway;
    @Autowired ReserveJobUseCase reserve;
    @Autowired OcrPersistenceUseCase ocr;
    @Autowired TranslationPersistenceUseCase translation;
    @Autowired RenderingPersistenceUseCase rendering;
    @Autowired GetJobResultUseCase result;
    @Autowired ResultDownloadRepository references;
    @Autowired TransactionTemplate transaction;
    @Autowired GatewayProperties properties;
    @Autowired JdbcClient jdbc;
    @MockitoBean Clock clock;
    @MockitoBean PrivateDownloadPort signer;
    private Instant now;
    @BeforeEach void clean() {
        jdbc.sql("DELETE FROM anonymous_installations").update();
        reset(clock, signer); now = Instant.now().truncatedTo(ChronoUnit.MICROS);
        when(clock.instant()).thenReturn(now); properties.getDisclosure().setResultRetentionSeconds(3600);
        when(signer.sign(any())).thenAnswer(call -> {
            PrivateDownloadRequest request = call.getArgument(0);
            var expiry = clock.instant().plusSeconds(30);
            if (request.resultExpiresAt().isBefore(expiry)) expiry = request.resultExpiresAt();
            return new PrivateDownload(URI.create("https://storage.googleapis.com/synthetic?signature=synthetic"),
                request.kind().mimeType(), 32, request.sha256(), expiry);
        });
    }

    @Test void snapshotAndDeadlineSurvivePolicyIncreaseThenExpireExactlyOnce() {
        var job = prepare(60);
        var artifacts = artifacts(now.plusSeconds(60));
        when(clock.instant()).thenReturn(now.plusSeconds(5));
        assertThat(rendering.complete(job.id(), artifacts, now.plusSeconds(5))).isTrue();
        properties.getDisclosure().setResultRetentionSeconds(60);
        assertThat(result.byRef(job.installationId(), job.jobRef()).result().expiresAt()).isEqualTo(now.plusSeconds(60));
        properties.getDisclosure().setResultRetentionSeconds(3600);
        assertThat(result.byRef(job.installationId(), job.jobRef()).result().expiresAt()).isEqualTo(now.plusSeconds(60));
        assertThat(jdbc.sql("SELECT result_retention_seconds FROM processing_jobs WHERE id=:id").param("id", job.id()).query(Integer.class).single()).isEqualTo(60);
        assertThat(jdbc.sql("SELECT result_expires_at FROM processing_job_stages WHERE job_id=:id AND stage='RENDERING'")
            .param("id", job.id()).query(OffsetDateTime.class).single().toInstant()).isEqualTo(now.plusSeconds(60));
        when(clock.instant()).thenReturn(now.plusSeconds(60));
        assertThat(result.byRef(job.installationId(), job.jobRef()).job().status()).isEqualTo(JobStatus.RESULT_EXPIRED);
        assertThat(result.byRef(job.installationId(), job.jobRef()).result()).isNull();
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_result_acknowledgements WHERE job_id=:id").param("id", job.id()).query(Integer.class).single()).isOne();
        assertThat(rendering.find(job.jobRef()).artifacts()).isEqualTo(artifacts);
    }

    @Test void shorterOperationalPolicyCanCloseButNeverReopenResult() {
        var job = prepare(60);
        assertThat(rendering.complete(job.id(), artifacts(now.plusSeconds(60)), now)).isTrue();
        properties.getDisclosure().setResultRetentionSeconds(1); when(clock.instant()).thenReturn(now.plusSeconds(1));
        assertThat(result.byRef(job.installationId(), job.jobRef()).job().status()).isEqualTo(JobStatus.RESULT_EXPIRED);
        properties.getDisclosure().setResultRetentionSeconds(3600);
        assertThat(result.byRef(job.installationId(), job.jobRef()).result()).isNull();
    }

    @Test void replayDoesNotChangeResultSnapshotAndConstraintsRejectInvalidMetadata() {
        var job = prepare(60);
        var retry = new GatewayRepository.NewJob(UUID.randomUUID(), UUID.randomUUID(), job.installationId(), job.idempotencyKey(), job.attemptRef(),
            "synthetic-v1", "ja", "pt-BR", "image/png", 32, 1, 1, "private/originals/retry", "a".repeat(64), "b".repeat(64),
            now, now.plus(7, ChronoUnit.DAYS), 3600, 3600);
        assertThat(reserve.execute(retry).created()).isFalse();
        assertThat(jdbc.sql("SELECT result_retention_seconds FROM processing_jobs WHERE id=:id").param("id", job.id()).query(Integer.class).single()).isEqualTo(60);
        for (int invalid : new int[] {0, 3601}) assertThatThrownBy(() -> jdbc.sql("UPDATE processing_jobs SET result_retention_seconds=:seconds WHERE id=:id")
            .param("seconds", invalid).param("id", job.id()).update()).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.sql("UPDATE processing_job_stages SET result_expires_at=now() WHERE job_id=:id AND stage='OCR'")
            .param("id", job.id()).update()).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test void wrongOrExpiredDeadlineCannotCommitReadyAndRollbackLeavesNoBinding() {
        var job = prepare(60);
        assertThatThrownBy(() -> rendering.complete(job.id(), artifacts(now.plusSeconds(61)), now)).isInstanceOf(RenderValidationException.class);
        when(clock.instant()).thenReturn(now.plusSeconds(60));
        assertThatThrownBy(() -> rendering.complete(job.id(), artifacts(now.plusSeconds(60)), now)).isInstanceOf(RenderValidationException.class);
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.RENDERING);
        assertThat(rendering.find(job.jobRef()).artifacts()).isNull();
        assertThat(jdbc.sql("SELECT result_expires_at FROM processing_job_stages WHERE job_id=:id AND stage='RENDERING'")
            .param("id", job.id()).query(OffsetDateTime.class).optional()).isEmpty();
    }

    @Test void persistedDeadlineMustMatchBothArtifactLocatorsBeforeSigning() {
        var job = prepare(60);
        assertThat(rendering.complete(job.id(), artifacts(now.plusSeconds(60)), now)).isTrue();
        jdbc.sql("UPDATE processing_job_stages SET result_expires_at=result_expires_at+INTERVAL '1 second' WHERE job_id=:id AND stage='RENDERING'")
            .param("id", job.id()).update();
        assertThatThrownBy(() -> transaction.execute(status -> references.findReady(job.installationId(), job.jobRef())))
            .isInstanceOf(RuntimeException.class);
        assertThatThrownBy(() -> rendering.find(job.jobRef())).isInstanceOf(RuntimeException.class);
    }

    @Test void readyDeadlineAndBindingsRollbackTogether() {
        var job = prepare(60);
        transaction.executeWithoutResult(status -> {
            assertThat(rendering.complete(job.id(), artifacts(now.plusSeconds(60)), now)).isTrue();
            status.setRollbackOnly();
        });
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.RENDERING);
        assertThat(rendering.find(job.jobRef()).artifacts()).isNull();
        assertThat(jdbc.sql("SELECT result_expires_at FROM processing_job_stages WHERE job_id=:id AND stage='RENDERING'")
            .param("id", job.id()).query(OffsetDateTime.class).optional()).isEmpty();
    }

    @Test void deadlineIsCheckedAfterWaitingForJobLockNotOnlyBeforeUpload() throws Exception {
        var job = prepare(60);
        var output = artifacts(now.plusSeconds(60));
        var held = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var owner = pool.submit(() -> transaction.executeWithoutResult(status -> {
                jdbc.sql("SELECT id FROM processing_jobs WHERE id=:id FOR UPDATE").param("id", job.id()).query(UUID.class).single();
                held.countDown();
                try { assertThat(release.await(10, TimeUnit.SECONDS)).isTrue(); }
                catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new AssertionError("fixture interrupted"); }
            }));
            assertThat(held.await(10, TimeUnit.SECONDS)).isTrue();
            var commit = pool.submit(() -> {
                assertThatThrownBy(() -> rendering.complete(job.id(), output, now)).isInstanceOf(RenderValidationException.class);
                return true;
            });
            try {
                long end = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
                boolean waiting = false;
                while (System.nanoTime() < end) {
                    waiting = jdbc.sql("SELECT count(*) FROM pg_stat_activity WHERE wait_event_type='Lock' AND query LIKE '%processing_jobs%'")
                        .query(Integer.class).single() > 0;
                    if (waiting) break;
                    Thread.sleep(10);
                }
                assertThat(waiting).isTrue(); when(clock.instant()).thenReturn(now.plusSeconds(60));
            } finally { release.countDown(); owner.get(20, TimeUnit.SECONDS); }
            assertThat(commit.get(20, TimeUnit.SECONDS)).isTrue();
        }
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.RENDERING);
        assertThat(rendering.find(job.jobRef()).artifacts()).isNull();
    }

    @Test void v8UpgradeAddsOnlyV9AndNeverRenewsLegacyCompletionDeadline() {
        var job = prepare(3600);
        var legacyArtifacts = new RenderingJobRepository.Artifacts("private/rendering/legacy/image", new RenderedImage("image/webp", 32, 1, 1, "c".repeat(64)),
            "private/rendering/legacy/manifest", "d".repeat(64));
        assertThat(rendering.complete(job.id(), legacyArtifacts, now)).isTrue();
        String schema = "result_retention_upgrade";
        Flyway.configure().dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
            .schemas(schema).defaultSchema(schema).target(MigrationVersion.fromVersion("8")).load().migrate();
        var dataSource = new DriverManagerDataSource(POSTGRES.getJdbcUrl() + "&currentSchema=" + schema, POSTGRES.getUsername(), POSTGRES.getPassword());
        var legacy = JdbcClient.create(dataSource);
        legacy.sql("INSERT INTO anonymous_installations SELECT * FROM public.anonymous_installations WHERE id=:id").param("id", job.installationId()).update();
        copyLegacy(legacy, schema, "processing_jobs", "id", job.id());
        copyLegacy(legacy, schema, "processing_job_stages", "job_id", job.id());
        copyLegacy(legacy, schema, "processing_job_dispatches", "job_id", job.id());
        var migration = Flyway.configure().dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
            .schemas(schema).defaultSchema(schema).load().migrate();
        assertThat(migration.migrationsExecuted).isEqualTo(1);
        assertThat(legacy.sql("SELECT result_retention_seconds FROM processing_jobs WHERE id=:id").param("id", job.id()).query(Integer.class).single()).isEqualTo(3600);
        var boundary = new JdbcResultDownloadRepository(legacy);
        var legacyTx = new TransactionTemplate(new DataSourceTransactionManager(dataSource));
        var projected = legacyTx.execute(status -> boundary.findReady(job.installationId(), job.jobRef()).orElseThrow());
        assertThat(projected.completedAt()).isEqualTo(now);
        assertThat(projected.resultExpiresAt()).isEqualTo(now.plusSeconds(3600));
    }

    private void copyLegacy(JdbcClient legacy, String schema, String table, String idColumn, UUID id) {
        var columns = legacy.sql("SELECT column_name FROM information_schema.columns WHERE table_schema=:schema AND table_name=:table ORDER BY ordinal_position")
            .param("schema", schema).param("table", table).query(String.class).list();
        legacy.sql("INSERT INTO " + table + " (" + String.join(",", columns) + ") SELECT " + String.join(",", columns)
            + " FROM public." + table + " WHERE " + idColumn + "=:id").param("id", id).update();
    }

    private ProcessingJob prepare(int seconds) {
        var owner = UUID.randomUUID(); transaction.executeWithoutResult(status -> gateway.createInstallation(owner, "fixture-" + owner, now));
        var job = reserve.execute(new GatewayRepository.NewJob(UUID.randomUUID(), UUID.randomUUID(), owner, UUID.randomUUID(), UUID.randomUUID(),
            "synthetic-v1", "ja", "pt-BR", "image/png", 32, 1, 1, "private/originals/synthetic", "a".repeat(64), "b".repeat(64),
            now, now.plus(7, ChronoUnit.DAYS), 3600, seconds)).job();
        ocr.claim(job.jobRef(), now); assertThat(ocr.complete(job.id(), "private/ocr/synthetic", "a".repeat(64), now)).isTrue();
        translation.claim(job.jobRef(), now); assertThat(translation.complete(job.id(), "private/translation/synthetic", "b".repeat(64), now)).isTrue();
        rendering.claim(job.jobRef(), now); return job;
    }
    private RenderingJobRepository.Artifacts artifacts(Instant deadline) {
        return new RenderingJobRepository.Artifacts(ResultObjectKey.create(deadline, "webp"), new RenderedImage("image/webp", 32, 1, 1, "c".repeat(64)),
            ResultObjectKey.create(deadline, "json"), "d".repeat(64));
    }
}
