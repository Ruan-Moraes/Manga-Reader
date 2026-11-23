package com.toonlira.translationgateway.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.reset;

import com.toonlira.translationgateway.application.OcrPersistenceUseCase;
import com.toonlira.translationgateway.application.TranslationPersistenceUseCase;
import com.toonlira.translationgateway.application.RenderingPersistenceUseCase;
import com.toonlira.translationgateway.application.OriginalExpirationUseCase;
import com.toonlira.translationgateway.application.ReserveJobUseCase;
import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.application.port.OcrJobRepository;
import com.toonlira.translationgateway.application.port.TranslationJobRepository;
import com.toonlira.translationgateway.application.port.RenderingJobRepository;
import com.toonlira.translationgateway.domain.OriginalObjectKey;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.ProcessingJob;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
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
class OriginalRetentionPersistenceTest {
    @Container static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");
    @DynamicPropertySource static void database(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", POSTGRES::getJdbcUrl); r.add("spring.datasource.username", POSTGRES::getUsername);
        r.add("spring.datasource.password", POSTGRES::getPassword);
    }
    @Autowired GatewayRepository repository;
    @Autowired ReserveJobUseCase reserve;
    @Autowired OcrPersistenceUseCase ocr;
    @Autowired TranslationPersistenceUseCase translation;
    @Autowired RenderingPersistenceUseCase rendering;
    @Autowired OriginalExpirationUseCase expiration;
    @Autowired TransactionTemplate transaction;
    @Autowired JdbcClient jdbc;
    @MockitoBean Clock clock;
    private Instant now;
    @BeforeEach void clean() {
        jdbc.sql("DELETE FROM anonymous_installations").update(); reset(clock);
        now = Instant.now().truncatedTo(ChronoUnit.MICROS); when(clock.instant()).thenReturn(now);
    }

    @ParameterizedTest @ValueSource(strings = {"OCR", "TRANSLATING", "RENDERING"})
    void exactDeadlineRejectsReservationAndAtomicallyExpiresItsDispatch(String stage) {
        var job = prepare(stage, 2);
        var deadline = now.plusSeconds(2); when(clock.instant()).thenReturn(deadline);
        boolean rejected = switch (stage) {
            case "OCR" -> ocr.claim(job.jobRef(), now) == OcrJobRepository.Claim.ALREADY_HANDLED;
            case "TRANSLATING" -> translation.claim(job.jobRef(), now) == TranslationJobRepository.Claim.ALREADY_HANDLED;
            default -> rendering.claim(job.jobRef(), now) == RenderingJobRepository.Claim.ALREADY_HANDLED;
        };
        assertThat(rejected).isTrue();
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.FAILED);
        assertThat(jdbc.sql("SELECT status FROM processing_job_dispatches WHERE job_id=:id").param("id", job.id()).query(String.class).single()).isEqualTo("CANCELLED");
        assertThat(jdbc.sql("SELECT cleanup_scope FROM processing_job_lifecycle_cleanups WHERE job_id=:id").param("id", job.id()).query(String.class).single()).isEqualTo("ALL");
        assertThat(expiration.execute()).isZero();
    }

    @ParameterizedTest @ValueSource(strings = {"OCR", "TRANSLATING", "RENDERING"})
    void exactDeadlineRejectsCompletionAndKeepsNoNewArtifact(String stage) {
        var job = prepare(stage, 2);
        switch (stage) {
            case "OCR" -> assertThat(ocr.claim(job.jobRef(), now)).isEqualTo(OcrJobRepository.Claim.STARTED);
            case "TRANSLATING" -> assertThat(translation.claim(job.jobRef(), now)).isEqualTo(TranslationJobRepository.Claim.STARTED);
            default -> assertThat(rendering.claim(job.jobRef(), now)).isEqualTo(RenderingJobRepository.Claim.STARTED);
        }
        when(clock.instant()).thenReturn(now.plusSeconds(2));
        boolean accepted = switch (stage) {
            case "OCR" -> ocr.complete(job.id(), "private/late", "c".repeat(64), now);
            case "TRANSLATING" -> translation.complete(job.id(), "private/late", "c".repeat(64), now);
            default -> rendering.complete(job.id(), artifacts(), now);
        };
        assertThat(accepted).isFalse();
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.FAILED);
        assertThat(jdbc.sql("SELECT status FROM processing_job_stages WHERE job_id=:id AND stage=:stage")
            .param("id", job.id()).param("stage", stage).query(String.class).single()).isEqualTo("FAILED");
        assertThat(jdbc.sql("SELECT output_object_key FROM processing_job_stages WHERE job_id=:id AND stage=:stage")
            .param("id", job.id()).param("stage", stage).query(String.class).optional()).isEmpty();
    }

    @Test void snapshotIsPersistentAndReadyOutputSurvivesOriginalDeadline() {
        var job = prepare("RENDERING", 900);
        assertThat(rendering.claim(job.jobRef(), now)).isEqualTo(RenderingJobRepository.Claim.STARTED);
        assertThat(rendering.complete(job.id(), artifacts(), now)).isTrue();
        when(clock.instant()).thenReturn(now.plusSeconds(900));
        assertThat(expiration.execute()).isZero();
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.READY);
        assertThat(rendering.find(job.jobRef()).artifacts()).isEqualTo(artifacts());
        assertThat(jdbc.sql("SELECT original_retention_seconds FROM processing_jobs WHERE id=:id").param("id", job.id()).query(Integer.class).single()).isEqualTo(900);
        assertThatThrownBy(() -> jdbc.sql("UPDATE processing_jobs SET original_retention_seconds=3601 WHERE id=:id").param("id", job.id()).update()).isInstanceOf(RuntimeException.class);
    }

    @Test void expirationRollbackLeavesJobStageDispatchAndIntentUntouched() {
        var job = prepare("OCR", 2); when(clock.instant()).thenReturn(now.plusSeconds(2));
        transaction.executeWithoutResult(status -> { assertThat(repository.expireOriginals(100, now)).isEqualTo(1); status.setRollbackOnly(); });
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.QUEUED);
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_stages WHERE job_id=:id").param("id", job.id()).query(Integer.class).single()).isZero();
        assertThat(jdbc.sql("SELECT status FROM processing_job_dispatches WHERE job_id=:id").param("id", job.id()).query(String.class).single()).isEqualTo("PENDING");
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_lifecycle_cleanups WHERE job_id=:id").param("id", job.id()).query(Integer.class).single()).isZero();
        assertThat(expiration.execute()).isEqualTo(1);
    }

    @Test void completionReadsClockAfterWaitingForJobLock() throws Exception {
        var job = prepare("OCR", 2); ocr.claim(job.jobRef(), now);
        var entered = new CountDownLatch(1); var release = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var owner = pool.submit(() -> transaction.executeWithoutResult(status -> {
                jdbc.sql("SELECT id FROM processing_jobs WHERE id=:id FOR UPDATE").param("id", job.id()).query(UUID.class).single();
                entered.countDown();
                try { assertThat(release.await(10, TimeUnit.SECONDS)).isTrue(); }
                catch (InterruptedException e) { Thread.currentThread().interrupt(); throw new AssertionError("fixture interrupted"); }
            }));
            assertThat(entered.await(10, TimeUnit.SECONDS)).isTrue();
            var completion = pool.submit(() -> ocr.complete(job.id(), "private/late", "c".repeat(64), now));
            try {
                long end = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
                boolean blocked = false;
                while (System.nanoTime() < end) {
                    blocked = jdbc.sql("SELECT count(*) FROM pg_stat_activity WHERE wait_event_type='Lock' AND query LIKE '%processing_jobs%'").query(Integer.class).single() > 0;
                    if (blocked) break; Thread.sleep(10);
                }
                assertThat(blocked).isTrue(); when(clock.instant()).thenReturn(now.plusSeconds(2));
            } finally { release.countDown(); owner.get(20, TimeUnit.SECONDS); }
            assertThat(completion.get(20, TimeUnit.SECONDS)).isFalse();
        }
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.FAILED);
    }

    @Test void concurrentExpiryBatchesNeverProcessOneJobTwice() throws Exception {
        var first = prepare("OCR", 1);
        var second = prepare("OCR", 1);
        when(clock.instant()).thenReturn(now.plusSeconds(1));
        Callable<Integer> sweep = () -> transaction.execute(status -> repository.expireOriginals(1, now));
        try (var pool = Executors.newFixedThreadPool(2)) {
            var results = pool.invokeAll(List.of(sweep, sweep));
            assertThat(results.get(0).get() + results.get(1).get()).isEqualTo(2);
        }
        assertThat(rendering.find(first.jobRef()).status()).isEqualTo(JobStatus.FAILED);
        assertThat(rendering.find(second.jobRef()).status()).isEqualTo(JobStatus.FAILED);
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_lifecycle_cleanups").query(Integer.class).single()).isEqualTo(2);
        assertThat(expiration.execute()).isZero();
    }

    @Test void expiredCancellationClosesRunningStageWithoutChangingSucceededPredecessors() {
        var job = prepare("TRANSLATING", 1);
        translation.claim(job.jobRef(), now);
        transaction.executeWithoutResult(status -> repository.cancel(job.installationId(), job.jobRef(), now));
        when(clock.instant()).thenReturn(now.plusSeconds(1));
        assertThat(expiration.execute()).isEqualTo(1);
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.CANCELLED);
        assertThat(jdbc.sql("SELECT status FROM processing_job_stages WHERE job_id=:id ORDER BY stage")
            .param("id", job.id()).query(String.class).list()).containsExactly("SUCCEEDED", "CANCELLED");
    }

    @Test void replayCannotRenewOriginalSnapshotAndDatabaseRejectsInvalidBounds() {
        var job = prepare("OCR", 1);
        var candidate = new GatewayRepository.NewJob(UUID.randomUUID(), UUID.randomUUID(), job.installationId(), job.idempotencyKey(), job.attemptRef(),
            "synthetic-v1", "ja", "pt-BR", "image/png", 32, 1, 1, OriginalObjectKey.create(now, 3600), "a".repeat(64), "b".repeat(64),
            now.plusSeconds(1), now.plus(7, ChronoUnit.DAYS), 3600);
        assertThat(reserve.execute(candidate).created()).isFalse();
        assertThat(jdbc.sql("SELECT original_retention_seconds FROM processing_jobs WHERE id=:id")
            .param("id", job.id()).query(Integer.class).single()).isEqualTo(1);
        for (int invalid : new int[] {0, 3601}) {
            assertThatThrownBy(() -> jdbc.sql("UPDATE processing_jobs SET original_retention_seconds=:seconds WHERE id=:id")
                .param("seconds", invalid).param("id", job.id()).update()).isInstanceOf(org.springframework.dao.DataIntegrityViolationException.class);
        }
    }

    @Test void additiveV7UpgradePreservesCreationAndCompletedInputsWithoutRenewingRetention() {
        var job = prepare("RENDERING", 3600);
        String schema = "original_retention_upgrade";
        Flyway.configure().dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
            .schemas(schema).defaultSchema(schema).target(MigrationVersion.fromVersion("7")).load().migrate();
        var legacy = JdbcClient.create(new DriverManagerDataSource(POSTGRES.getJdbcUrl() + "&currentSchema=" + schema,
            POSTGRES.getUsername(), POSTGRES.getPassword()));
        legacy.sql("INSERT INTO anonymous_installations SELECT * FROM public.anonymous_installations WHERE id=:id")
            .param("id", job.installationId()).update();
        var columns = legacy.sql("SELECT column_name FROM information_schema.columns WHERE table_schema=:schema AND table_name='processing_jobs' ORDER BY ordinal_position")
            .param("schema", schema).query(String.class).list();
        assertThat(columns).doesNotContain("original_retention_seconds");
        legacy.sql("INSERT INTO processing_jobs (" + String.join(",", columns) + ") SELECT " + String.join(",", columns)
            + " FROM public.processing_jobs WHERE id=:id").param("id", job.id()).update();
        var stageColumns = legacy.sql("SELECT column_name FROM information_schema.columns WHERE table_schema=:schema AND table_name='processing_job_stages' ORDER BY ordinal_position")
            .param("schema", schema).query(String.class).list();
        legacy.sql("INSERT INTO processing_job_stages (" + String.join(",", stageColumns) + ") SELECT " + String.join(",", stageColumns)
            + " FROM public.processing_job_stages WHERE job_id=:id")
            .param("id", job.id()).update();
        legacy.sql("INSERT INTO processing_job_dispatches SELECT * FROM public.processing_job_dispatches WHERE job_id=:id")
            .param("id", job.id()).update();
        // V7 originals use the historical opaque locator; never synthesize a shorter disclosure for legacy.
        legacy.sql("UPDATE processing_jobs SET original_object_key=:key WHERE id=:id")
            .param("key", "private/originals/legacy-" + UUID.randomUUID()).param("id", job.id()).update();
        var migrated = Flyway.configure().dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
            .schemas(schema).defaultSchema(schema).target(MigrationVersion.fromVersion("8")).load().migrate();
        assertThat(migrated.migrationsExecuted).isEqualTo(1);
        assertThat(legacy.sql("SELECT original_retention_seconds FROM processing_jobs WHERE id=:id")
            .param("id", job.id()).query(Integer.class).single()).isEqualTo(3600);
        assertThat(legacy.sql("SELECT created_at FROM processing_jobs WHERE id=:id")
            .param("id", job.id()).query(OffsetDateTime.class).single().toInstant()).isEqualTo(now);
        var guards = new JdbcOriginalRetention(legacy, clock);
        when(clock.instant()).thenReturn(now.plusSeconds(3600));
        assertThat(guards.available(job.id(), now)).isFalse();
        assertThat(legacy.sql("SELECT status FROM processing_job_stages WHERE job_id=:id ORDER BY stage")
            .param("id", job.id()).query(String.class).list()).containsExactly("SUCCEEDED", "SUCCEEDED");
        assertThat(legacy.sql("SELECT status FROM processing_job_dispatches WHERE job_id=:id")
            .param("id", job.id()).query(String.class).single()).isEqualTo("PENDING");
        assertThat(legacy.sql("SELECT version FROM flyway_schema_history WHERE success AND version IS NOT NULL ORDER BY installed_rank")
            .query(String.class).list()).containsExactly("1", "2", "3", "4", "5", "6", "7", "8");
    }

    @Test void realExpirationQueryIsBoundedAndGuardUsesExistingPrimaryKey() {
        var job = prepare("OCR", 1);
        var at = OffsetDateTime.ofInstant(now.plusSeconds(1), ZoneOffset.UTC);
        var guardPlan = jdbc.sql("EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) " + JdbcOriginalRetention.ACTIVE_SQL)
            .param("id", job.id()).param("now", at).query(String.class).list();
        assertThat(guardPlan).anyMatch(line -> line.contains("Index Scan") && line.contains("processing_jobs_pkey"));
        var batchPlan = transaction.execute(status -> {
            var plan = jdbc.sql("EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) " + JdbcOriginalRetention.EXPIRATION_SQL)
                .param("jobId", null).param("limit", 1).param("now", at).query(String.class).list();
            status.setRollbackOnly();
            return plan;
        });
        assertThat(batchPlan).anyMatch(line -> line.contains("Limit")).anyMatch(line -> line.contains("LockRows"));
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.QUEUED);
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_lifecycle_cleanups").query(Integer.class).single()).isZero();
        // No raw EXPLAIN output: PostgreSQL may include job identifiers in its plan.
    }

    @Test void expiryBatchSkipsLockedJobAndProcessesItAfterItsOwnerReleases() throws Exception {
        var locked = prepare("OCR", 1);
        var available = prepare("OCR", 1);
        when(clock.instant()).thenReturn(now.plusSeconds(1));
        var held = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        try (var pool = Executors.newSingleThreadExecutor()) {
            var owner = pool.submit(() -> transaction.executeWithoutResult(status -> {
                jdbc.sql("SELECT id FROM processing_jobs WHERE id=:id FOR UPDATE")
                    .param("id", locked.id()).query(UUID.class).single();
                held.countDown();
                try { assertThat(release.await(10, TimeUnit.SECONDS)).isTrue(); }
                catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new AssertionError("fixture interrupted"); }
            }));
            try {
                assertThat(held.await(10, TimeUnit.SECONDS)).isTrue();
                assertThat(expiration.execute()).isEqualTo(1);
                assertThat(rendering.find(available.jobRef()).status()).isEqualTo(JobStatus.FAILED);
                assertThat(rendering.find(locked.jobRef()).status()).isEqualTo(JobStatus.QUEUED);
            } finally { release.countDown(); }
            owner.get(20, TimeUnit.SECONDS);
        }
        assertThat(expiration.execute()).isEqualTo(1);
        assertThat(rendering.find(locked.jobRef()).status()).isEqualTo(JobStatus.FAILED);
        assertThat(expiration.execute()).isZero();
    }

    private ProcessingJob prepare(String stage, int seconds) {
        var installation = UUID.randomUUID(); transaction.executeWithoutResult(ignored -> repository.createInstallation(installation, "fixture-" + installation, now));
        var job = reserve.execute(new GatewayRepository.NewJob(UUID.randomUUID(), UUID.randomUUID(), installation, UUID.randomUUID(), UUID.randomUUID(),
            "synthetic-v1", "ja", "pt-BR", "image/png", 32, 1, 1, OriginalObjectKey.create(now, seconds), "a".repeat(64), "b".repeat(64),
            now, now.plus(7, ChronoUnit.DAYS), seconds)).job();
        if (!stage.equals("OCR")) { ocr.claim(job.jobRef(), now); assertThat(ocr.complete(job.id(), "private/ocr", "a".repeat(64), now)).isTrue(); }
        if (stage.equals("RENDERING")) { translation.claim(job.jobRef(), now); assertThat(translation.complete(job.id(), "private/translation", "b".repeat(64), now)).isTrue(); }
        return job;
    }
    private RenderingJobRepository.Artifacts artifacts() {
        return new RenderingJobRepository.Artifacts("private/image", new RenderedImage("image/webp", 32, 1, 1, "c".repeat(64)), "private/manifest", "d".repeat(64));
    }
}
