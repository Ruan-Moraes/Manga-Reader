package com.toonlira.translationgateway.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.never;

import com.toonlira.translationgateway.application.OcrPersistenceUseCase;
import com.toonlira.translationgateway.application.GetJobUseCase;
import com.toonlira.translationgateway.application.GetJobResultUseCase;
import com.toonlira.translationgateway.application.port.PrivateDownloadPort;
import com.toonlira.translationgateway.application.port.ResultDownloadRepository;
import com.toonlira.translationgateway.application.port.LifecycleCleanupRepository;
import com.toonlira.translationgateway.application.LifecycleCleanupPersistenceUseCase;
import com.toonlira.translationgateway.application.CancelJobUseCase;
import com.toonlira.translationgateway.application.DispatchPersistenceUseCase;
import com.toonlira.translationgateway.application.CleanupLifecycleObjectsUseCase;
import com.toonlira.translationgateway.application.CleanupAcknowledgedResultsUseCase;
import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.doThrow;
import java.time.Clock;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.io.TempDir;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.infrastructure.storage.LocalObjectStorageAdapter;
import com.toonlira.translationgateway.domain.rendering.PrivateDownload;
import com.toonlira.translationgateway.domain.rendering.PrivateDownloadRequest;
import com.toonlira.translationgateway.application.RenderingPersistenceUseCase;
import com.toonlira.translationgateway.application.ReserveJobUseCase;
import com.toonlira.translationgateway.application.ResultAcknowledgementPersistenceUseCase;
import com.toonlira.translationgateway.application.TranslationPersistenceUseCase;
import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.application.port.OcrJobRepository;
import com.toonlira.translationgateway.application.port.RenderingJobRepository;
import com.toonlira.translationgateway.application.port.ResultAcknowledgementRepository;
import com.toonlira.translationgateway.application.port.TranslationJobRepository;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.ProcessingJob;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderValidationException;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import java.net.URI;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.stream.IntStream;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.InvalidDataAccessApiUsageException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Tag("testcontainers")
@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class RenderingPersistenceTest {
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired JdbcClient jdbc;
    @Autowired ReserveJobUseCase reserve;
    @Autowired OcrPersistenceUseCase ocr;
    @Autowired TranslationPersistenceUseCase translation;
    @Autowired RenderingPersistenceUseCase rendering;
    @Autowired RenderingJobRepository renderingRepository;
    @Autowired ResultAcknowledgementPersistenceUseCase acknowledgements;
    @Autowired ResultAcknowledgementRepository acknowledgementRepository;
    @Autowired GatewayRepository gateway;
    @MockitoBean Clock clock;
    @Autowired GetJobUseCase getJob;
    @Autowired GetJobResultUseCase getJobResult;
    @Autowired ResultDownloadRepository resultDownloads;
    @Autowired LifecycleCleanupRepository lifecycleRepository;
    @Autowired LifecycleCleanupPersistenceUseCase lifecycle;
    @Autowired CleanupLifecycleObjectsUseCase lifecycleCleanup;
    @Autowired CleanupAcknowledgedResultsUseCase acknowledgedCleanup;
    @Autowired CancelJobUseCase cancelJob;
    @Autowired DispatchPersistenceUseCase dispatch;
    @MockitoBean ObjectStoragePort cleanupStorage;
    @MockitoBean PrivateDownloadPort signer;
    @Autowired TransactionTemplate transaction;
    private Instant now;
    @TempDir Path lifecycleFiles;

    @Test
    void immediateClaimTargetsOnlyRequestedJobAndPreservesPendingOthers() {
        var first = newJob();
        var second = newJob();
        jdbc.sql("UPDATE processing_jobs SET status = 'FAILED', error_code = 'dispatch-unavailable'").update();
        var lease = now.plusSeconds(300);
        var claim = lifecycle.claimForJob(first.id(), now, lease);
        assertThat(claim.jobId()).isEqualTo(first.id());
        assertThat(lifecycle.claimForJob(first.id(), now, lease)).isNull();
        assertThat(lifecycle.reconcile(100, now)).isEqualTo(1);
        assertThat(lifecycle.claim(100, now, lease)).extracting(LifecycleCleanupRepository.CleanupClaim::jobId)
            .containsExactly(second.id());
    }

    @ParameterizedTest
    @ValueSource(strings = {"cancel", "dispatch"})
    void terminalControlCleanupRunsOnlyAfterCommitOutsideTransaction(String path) {
        var job = newJob();
        var originalKey = rendering.find(job.jobRef()).originalObjectKey();
        doAnswer(call -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            assertThat(rendering.find(job.jobRef()).status()).isEqualTo(path.equals("cancel") ? JobStatus.CANCELLED : JobStatus.FAILED);
            return null;
        }).when(cleanupStorage).delete(originalKey);
        transaction.executeWithoutResult(ignored -> {
            terminalControl(path, job);
            verifyNoInteractions(cleanupStorage);
            assertThat(jdbc.sql("SELECT completed_at IS NULL FROM processing_job_lifecycle_cleanups WHERE job_id = :id")
                .param("id", job.id()).query(Boolean.class).single()).isTrue();
        });
        verify(cleanupStorage).delete(originalKey);
        assertThat(jdbc.sql("SELECT completed_at IS NOT NULL FROM processing_job_lifecycle_cleanups WHERE job_id = :id")
            .param("id", job.id()).query(Boolean.class).single()).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"cancel", "dispatch"})
    void terminalControlRollbackDoesNotDeleteOrKeepCleanupIntent(String path) {
        var job = newJob();
        assertThatThrownBy(() -> transaction.executeWithoutResult(ignored -> {
            terminalControl(path, job);
            throw new IllegalStateException("synthetic control rollback");
        })).isInstanceOf(IllegalStateException.class);
        verifyNoInteractions(cleanupStorage);
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.QUEUED);
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_lifecycle_cleanups WHERE job_id = :id")
            .param("id", job.id()).query(Integer.class).single()).isZero();
    }

    @Test
    void pendingActiveCancellationDoesNotScheduleObjectRemoval() {
        var job = newJob();
        ocr.claim(job.jobRef(), now);
        assertThat(cancelJob.execute(job.installationId(), job.jobRef()).status()).isEqualTo(JobStatus.CANCEL_PENDING);
        verifyNoInteractions(cleanupStorage);
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_lifecycle_cleanups WHERE job_id = :id")
            .param("id", job.id()).query(Integer.class).single()).isZero();
    }

    @Test
    void retryableDispatchFailureNeverRemovesOriginal() {
        var job = newJob();
        setDispatchAttempt(job.id(), 1);
        dispatch.fail(job.id(), 1, 8, now);
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.QUEUED);
        verifyNoInteractions(cleanupStorage);
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_lifecycle_cleanups WHERE job_id = :id")
            .param("id", job.id()).query(Integer.class).single()).isZero();
    }

    @Test
    void exhaustedLateDispatchFailureCannotTerminateAnAlreadyDispatchedJob() {
        var job = newJob();
        setDispatchAttempt(job.id(), 7);
        var claim = dispatch.claim(1, now, now.plusSeconds(60)).getFirst();
        assertThat(claim.attemptCount()).isEqualTo(8);
        assertThat(dispatch.complete(job.id(), claim.attemptCount(), now)).isTrue();
        assertThat(dispatch.fail(job.id(), claim.attemptCount(), 8, now.plusSeconds(1))).isFalse();
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.QUEUED);
        assertThat(jdbc.sql("SELECT status FROM processing_job_dispatches WHERE job_id = :id")
            .param("id", job.id()).query(String.class).single()).isEqualTo("DISPATCHED");
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_lifecycle_cleanups WHERE job_id = :id")
            .param("id", job.id()).query(Integer.class).single()).isZero();
        verifyNoInteractions(cleanupStorage);
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 8})
    void expiredDispatchFailureCannotOverwriteTheNewLease(int attempt) {
        var job = newJob();
        setDispatchAttempt(job.id(), attempt - 1);
        var oldClaim = dispatch.claim(1, now, now.plusSeconds(60)).getFirst();
        var lease = now.plusSeconds(121);
        var newClaim = dispatch.claim(1, now.plusSeconds(61), lease).getFirst();
        assertThat(newClaim.attemptCount()).isEqualTo(oldClaim.attemptCount() + 1);
        assertThat(dispatch.fail(job.id(), oldClaim.attemptCount(), 8, now.plusSeconds(62))).isFalse();
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.QUEUED);
        assertThat(jdbc.sql("SELECT status FROM processing_job_dispatches WHERE job_id = :id")
            .param("id", job.id()).query(String.class).single()).isEqualTo("PENDING");
        assertThat(jdbc.sql("SELECT next_attempt_at FROM processing_job_dispatches WHERE job_id = :id")
            .param("id", job.id()).query(OffsetDateTime.class).single().toInstant()).isEqualTo(lease);
        verifyNoInteractions(cleanupStorage);
    }

    @Test
    void unclaimedOutboxCannotBeCompletedOrFailed() {
        var job = newJob();
        assertThat(dispatch.complete(job.id(), 0, now)).isFalse();
        assertThat(dispatch.fail(job.id(), 0, 8, now)).isFalse();
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.QUEUED);
        assertThat(jdbc.sql("SELECT status FROM processing_job_dispatches WHERE job_id = :id")
            .param("id", job.id()).query(String.class).single()).isEqualTo("PENDING");
        verifyNoInteractions(cleanupStorage);
    }

    @Test
    void repeatedTerminalDispatchFailureCannotReopenCleanup() {
        var job = newJob();
        setDispatchAttempt(job.id(), 8);
        assertThat(dispatch.fail(job.id(), 8, 8, now)).isTrue();
        assertThat(dispatch.fail(job.id(), 8, 8, now.plusSeconds(61))).isFalse();
        assertThat(jdbc.sql("SELECT completed_at IS NOT NULL FROM processing_job_lifecycle_cleanups WHERE job_id = :id")
            .param("id", job.id()).query(Boolean.class).single()).isTrue();
        verify(cleanupStorage, times(1)).delete(rendering.find(job.jobRef()).originalObjectKey());
    }

    @Test
    void dispatchPointLocksAndOwnershipPredicatesUseExistingIndexedKeys() {
        var job = newJob();
        var jobPlan = jdbc.sql("EXPLAIN (ANALYZE, COSTS FALSE) SELECT id FROM processing_jobs WHERE id = :id FOR UPDATE")
            .param("id", job.id()).query(String.class).list();
        var outboxPlan = jdbc.sql("""
                EXPLAIN (ANALYZE, COSTS FALSE)
                SELECT job_id FROM processing_job_dispatches
                WHERE job_id = :id AND status = 'PENDING' AND attempt_count = 0 FOR UPDATE
                """).param("id", job.id()).query(String.class).list();
        assertThat(jobPlan).anyMatch(line -> line.contains("LockRows"));
        assertThat(outboxPlan).anyMatch(line -> line.contains("LockRows"));
        assertThat(jdbc.sql("""
                SELECT indexdef FROM pg_indexes WHERE schemaname = 'public'
                  AND tablename IN ('processing_jobs', 'processing_job_dispatches')
                """).query(String.class).list())
            .anyMatch(line -> line.contains("processing_jobs_pkey") && line.contains("(id)"))
            .anyMatch(line -> line.contains("processing_job_dispatches_pkey") && line.contains("(job_id)"));
        // Raw EXPLAIN can contain private job IDs. Inspect assertions only; never print the plans.
    }

    @Test
    void expiredDispatchCompletionCannotOverwriteTheNewLease() {
        var job = newJob();
        var oldClaim = dispatch.claim(1, now, now.plusSeconds(60)).getFirst();
        var lease = now.plusSeconds(121);
        var newClaim = dispatch.claim(1, now.plusSeconds(61), lease).getFirst();
        assertThat(dispatch.complete(job.id(), oldClaim.attemptCount(), now.plusSeconds(62))).isFalse();
        assertThat(jdbc.sql("SELECT status FROM processing_job_dispatches WHERE job_id = :id")
            .param("id", job.id()).query(String.class).single()).isEqualTo("PENDING");
        assertThat(jdbc.sql("SELECT attempt_count FROM processing_job_dispatches WHERE job_id = :id")
            .param("id", job.id()).query(Integer.class).single()).isEqualTo(newClaim.attemptCount());
        verifyNoInteractions(cleanupStorage);
    }

    @Test
    void exhaustedDispatchWaitsForJobBeforeOutboxAndLosesSafelyToCancellation() throws Exception {
        var job = newJob();
        jdbc.sql("UPDATE processing_job_dispatches SET attempt_count = 8 WHERE job_id = :id")
            .param("id", job.id()).update();
        var entered = new CountDownLatch(1);
        var dispatcherPid = new AtomicInteger();
        var pending = new AtomicReference<Future<?>>();
        try (var executor = Executors.newSingleThreadExecutor()) {
            transaction.executeWithoutResult(ignored -> {
                jdbc.sql("SELECT id FROM processing_jobs WHERE id = :id FOR UPDATE")
                    .param("id", job.id()).query(UUID.class).single();
                var holderPid = jdbc.sql("SELECT pg_backend_pid()").query(Integer.class).single();
                pending.set(executor.submit(() -> transaction.executeWithoutResult(unused -> {
                    dispatcherPid.set(jdbc.sql("SELECT pg_backend_pid()").query(Integer.class).single());
                    entered.countDown();
                    dispatch.fail(job.id(), 8, 8, now);
                })));
                try { assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue(); }
                catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new IllegalStateException(error); }
                long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
                boolean blocked = false;
                while (!blocked && System.nanoTime() < deadline) {
                    blocked = jdbc.sql("SELECT :holder = ANY(pg_blocking_pids(:waiter))")
                        .param("holder", holderPid).param("waiter", dispatcherPid.get()).query(Boolean.class).single();
                }
                assertThat(blocked).as("PostgreSQL confirms dispatch is waiting on the held job").isTrue();
                // A dispatcher waiting on the job must not already own the outbox: cancellation needs both.
                jdbc.sql("SELECT job_id FROM processing_job_dispatches WHERE job_id = :id FOR UPDATE NOWAIT")
                    .param("id", job.id()).query(UUID.class).single();
                assertThat(cancelJob.execute(job.installationId(), job.jobRef()).status()).isEqualTo(JobStatus.CANCELLED);
            });
            pending.get().get(10, TimeUnit.SECONDS);
        }
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.CANCELLED);
        assertThat(jdbc.sql("SELECT status FROM processing_job_dispatches WHERE job_id = :id")
            .param("id", job.id()).query(String.class).single()).isEqualTo("CANCELLED");
        verify(cleanupStorage, times(1)).delete(rendering.find(job.jobRef()).originalObjectKey());
    }

    @ParameterizedTest
    @ValueSource(strings = {"cancel", "dispatch"})
    void failedPostCommitRemovalDoesNotReplaceControlOutcomeAndRemainsRecoverable(String path) {
        var job = newJob();
        var originalKey = rendering.find(job.jobRef()).originalObjectKey();
        doThrow(new IllegalStateException("sensitive storage failure")).when(cleanupStorage).delete(originalKey);
        terminalControl(path, job);
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(path.equals("cancel") ? JobStatus.CANCELLED : JobStatus.FAILED);
        assertThat(jdbc.sql("SELECT completed_at IS NULL FROM processing_job_lifecycle_cleanups WHERE job_id = :id")
            .param("id", job.id()).query(Boolean.class).single()).isTrue();
        reset(cleanupStorage);
        var retryAt = Instant.now().plusSeconds(61);
        var recovery = new CleanupLifecycleObjectsUseCase(lifecycle, cleanupStorage, Clock.fixed(retryAt, ZoneOffset.UTC));
        assertThat(recovery.executeForJob(job.id())).isEqualTo(new CleanupLifecycleObjectsUseCase.Result(1, 0));
        verify(cleanupStorage).delete(originalKey);
    }

    private void terminalControl(String path, ProcessingJob job) {
        if (path.equals("cancel")) cancelJob.execute(job.installationId(), job.jobRef());
        else {
            setDispatchAttempt(job.id(), 8);
            dispatch.fail(job.id(), 8, 8, now);
        }
    }

    private void setDispatchAttempt(UUID jobId, int attempt) {
        // These fixtures model an already acquired dispatch lease; no production bypass is exposed.
        jdbc.sql("UPDATE processing_job_dispatches SET attempt_count = :attempt WHERE job_id = :id")
            .param("attempt", attempt).param("id", jobId).update();
    }

    @Test
    void acknowledgedCleanupSuspendsCallerTransactionDuringStorageAndConfirmsIndependently() {
        var job = readyDownloadJob();
        transaction.executeWithoutResult(ignored -> acknowledgementRepository.request(job.installationId(), job.jobRef(), now));
        doAnswer(call -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            return null;
        }).when(cleanupStorage).delete(any());
        assertThatThrownBy(() -> transaction.executeWithoutResult(ignored -> {
            assertThat(acknowledgedCleanup.execute()).isEqualTo(new CleanupAcknowledgedResultsUseCase.Result(1, 0));
            throw new IllegalStateException("synthetic caller rollback");
        })).isInstanceOf(IllegalStateException.class).hasMessage("synthetic caller rollback");
        assertThat(jdbc.sql("SELECT completed_at IS NOT NULL FROM processing_job_result_acknowledgements WHERE job_id = :id")
            .param("id", job.id()).query(Boolean.class).single()).isTrue();
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.RESULT_EXPIRED);
    }

    @ParameterizedTest
    @ValueSource(strings = {"ack", "lifecycle-batch", "lifecycle-immediate"})
    void failedOwnedObjectDoesNotPreventOtherRemovalsAndRetriesOnlyAfterDurableDelay(String path) {
        var job = path.equals("ack") ? readyJob() : prepareRendering();
        var active = prepareRendering();
        var original = rendering.find(job.jobRef()).originalObjectKey();
        var activeOriginal = rendering.find(active.jobRef()).originalObjectKey();
        var keys = path.equals("ack")
            ? List.of(original, "private/ocr/" + job.id(), "private/translation/" + job.id(),
                artifacts(job.id()).imageObjectKey(), artifacts(job.id()).manifestObjectKey())
            : List.of(original, "private/ocr/" + job.id(), "private/translation/" + job.id());
        if (path.equals("ack")) {
            transaction.executeWithoutResult(ignored -> acknowledgementRepository.request(job.installationId(), job.jobRef(), now));
        } else {
            rendering.failUnclaimed(job.id(), GatewayErrorCode.INTERNAL_ERROR, now);
        }
        var table = path.equals("ack") ? "processing_job_result_acknowledgements" : "processing_job_lifecycle_cleanups";
        var failedOnce = new AtomicInteger();
        doAnswer(call -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            if (original.equals(call.getArgument(0)) && failedOnce.getAndIncrement() == 0) {
                throw new GatewayException(GatewayErrorCode.STORAGE_UNAVAILABLE, 503, true);
            }
            return null;
        }).when(cleanupStorage).delete(any());

        assertCleanupOutcome(path, job.id(), 0, 1);
        for (var key : keys) verify(cleanupStorage).delete(key);
        assertThat(jdbc.sql("SELECT completed_at IS NULL FROM " + table + " WHERE job_id = :id")
            .param("id", job.id()).query(Boolean.class).single()).isTrue();
        assertThat(jdbc.sql("SELECT next_attempt_at FROM " + table + " WHERE job_id = :id")
            .param("id", job.id()).query(OffsetDateTime.class).single().toInstant()).isEqualTo(now.plusSeconds(60));
        when(clock.instant()).thenReturn(now.plusSeconds(59));
        assertCleanupOutcome(path, job.id(), 0, 0);
        for (var key : keys) verify(cleanupStorage).delete(key);
        when(clock.instant()).thenReturn(now.plusSeconds(60));
        assertCleanupOutcome(path, job.id(), 1, 0);
        for (var key : keys) verify(cleanupStorage, times(2)).delete(key);
        assertThat(jdbc.sql("SELECT completed_at FROM " + table + " WHERE job_id = :id")
            .param("id", job.id()).query(OffsetDateTime.class).single().toInstant()).isEqualTo(now.plusSeconds(60));
        assertCleanupOutcome(path, job.id(), 0, 0);
        for (var key : keys) verify(cleanupStorage, times(2)).delete(key);
        verify(cleanupStorage, never()).delete(activeOriginal);
        verify(cleanupStorage, never()).delete("private/ocr/" + active.id());
        verify(cleanupStorage, never()).delete("private/translation/" + active.id());
        assertThat(rendering.find(active.jobRef()).status()).isEqualTo(JobStatus.RENDERING);
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(path.equals("ack") ? JobStatus.RESULT_EXPIRED : JobStatus.FAILED);
    }

    private void assertCleanupOutcome(String path, UUID jobId, int completed, int deferred) {
        if (path.equals("ack")) {
            assertThat(acknowledgedCleanup.execute()).isEqualTo(new CleanupAcknowledgedResultsUseCase.Result(completed, deferred));
        } else {
            var result = path.equals("lifecycle-batch") ? lifecycleCleanup.execute() : lifecycleCleanup.executeForJob(jobId);
            assertThat(result).isEqualTo(new CleanupLifecycleObjectsUseCase.Result(completed, deferred));
        }
    }

    @Test
    void immediateCleanupSuspendsCallerTransactionAndDoesNotAcknowledgeResult() {
        var job = readyDownloadJob();
        doAnswer(call -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            return null;
        }).when(cleanupStorage).delete(any());
        var result = transaction.execute(ignored -> lifecycleCleanup.executeForJob(job.id()));
        assertThat(result).isEqualTo(new CleanupLifecycleObjectsUseCase.Result(1, 0));
        verify(cleanupStorage).delete(rendering.find(job.jobRef()).originalObjectKey());
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.READY);
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_result_acknowledgements").query(Long.class).single()).isZero();
    }

    @Test
    void immediateClaimNeverMaterializesReferencesOfActiveJob() {
        var job = prepareRendering();
        rendering.claim(job.jobRef(), now);
        assertThat(lifecycle.claimForJob(job.id(), now, now.plusSeconds(300))).isNull();
        assertThat(lifecycle.claim(100, now, now.plusSeconds(300))).isEmpty();
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.RENDERING);
    }

    @Test
    void realLocalObjectsSurviveFailedDeleteThenRecoverWithoutRemovingReadyArtifactsOrReusableSample() throws Exception {
        var job = prepareRendering();
        rendering.claim(job.jobRef(), now);
        rendering.complete(job.id(), artifacts(job.id()), now);
        var properties = new GatewayProperties();
        properties.getStorage().setLocalDirectory(lifecycleFiles.resolve("owned-storage"));
        var storage = spy(new LocalObjectStorageAdapter(properties));
        var sample = lifecycleFiles.resolve("reusable-sample.png");
        Files.write(sample, new byte[] {1, 2, 3});
        var original = rendering.find(job.jobRef()).originalObjectKey();
        for (var key : List.of(original, artifacts(job.id()).imageObjectKey(), artifacts(job.id()).manifestObjectKey())) {
            storage.store(key, sample, "application/octet-stream", "a".repeat(64), now);
        }
        doThrow(new GatewayException(GatewayErrorCode.STORAGE_UNAVAILABLE, 503, true)).doCallRealMethod()
            .when(storage).delete(original);
        var first = new CleanupLifecycleObjectsUseCase(lifecycle, storage, Clock.fixed(now, ZoneOffset.UTC)).execute();
        assertThat(first).isEqualTo(new CleanupLifecycleObjectsUseCase.Result(0, 1));
        assertThat(Files.exists(properties.getStorage().getLocalDirectory().resolve(original))).isTrue();
        var second = new CleanupLifecycleObjectsUseCase(lifecycle, storage, Clock.fixed(now.plusSeconds(60), ZoneOffset.UTC)).execute();
        assertThat(second).isEqualTo(new CleanupLifecycleObjectsUseCase.Result(1, 0));
        assertThat(Files.exists(properties.getStorage().getLocalDirectory().resolve(original))).isFalse();
        assertThat(Files.readAllBytes(sample)).containsExactly(1, 2, 3);
        assertThat(Files.exists(properties.getStorage().getLocalDirectory().resolve(artifacts(job.id()).imageObjectKey()))).isTrue();
        assertThat(Files.exists(properties.getStorage().getLocalDirectory().resolve(artifacts(job.id()).manifestObjectKey()))).isTrue();
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.READY);
    }

    @Test
    void lifecyclePreservesActiveOriginalAndDeletesOnlyOriginalAfterReadyWithoutAcknowledgingDownload() {
        var job = prepareRendering();
        assertThat(lifecycle.reconcile(100, now)).isZero();
        assertThat(lifecycle.claim(100, now, now.plusSeconds(300))).isEmpty();
        rendering.claim(job.jobRef(), now);
        assertThat(lifecycle.reconcile(100, now)).isZero();
        rendering.complete(job.id(), artifacts(job.id()), now);
        var claim = lifecycle.claim(100, now, now.plusSeconds(300)).getFirst();
        assertThat(claim.objectKeys()).containsExactly(rendering.find(job.jobRef()).originalObjectKey());
        assertThat(lifecycle.complete(job.id(), claim.leaseUntil(), now)).isTrue();
        assertThat(lifecycle.reconcile(100, now.plusSeconds(1))).isZero();
        assertThat(lifecycle.claim(100, now.plusSeconds(301), now.plusSeconds(601))).isEmpty();
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_result_acknowledgements").query(Long.class).single()).isZero();
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.READY);
        transaction.executeWithoutResult(ignored -> acknowledgementRepository.request(job.installationId(), job.jobRef(), now));
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.RESULT_EXPIRED);
        assertThat(acknowledgements.claim(100, now, now.plusSeconds(300)).getFirst().objectKeys())
            .contains(artifacts(job.id()).imageObjectKey(), artifacts(job.id()).manifestObjectKey());
    }

    @Test
    void terminalFailureAtomicallyQueuesAllReferencesAndCleanupRunsOutsideEvenOuterTransaction() {
        var job = prepareRendering();
        rendering.failUnclaimed(job.id(), GatewayErrorCode.INTERNAL_ERROR, now);
        assertThat(jdbc.sql("SELECT cleanup_scope FROM processing_job_lifecycle_cleanups WHERE job_id = :id")
            .param("id", job.id()).query(String.class).single()).isEqualTo("ALL");
        doAnswer(call -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            return null;
        }).when(cleanupStorage).delete(any());
        var result = transaction.execute(ignored -> lifecycleCleanup.execute());
        assertThat(result.completed()).isEqualTo(1);
        verify(cleanupStorage).delete(rendering.find(job.jobRef()).originalObjectKey());
        verify(cleanupStorage).delete("private/ocr/" + job.id());
        verify(cleanupStorage).delete("private/translation/" + job.id());
    }

    @Test
    void rollbackOfTerminalTransitionAlsoRollsBackCleanupIntent() {
        var job = prepareRendering();
        assertThatThrownBy(() -> transaction.executeWithoutResult(ignored -> {
            rendering.failUnclaimed(job.id(), GatewayErrorCode.INTERNAL_ERROR, now);
            throw new IllegalStateException("synthetic rollback");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.RENDERING);
        assertThat(lifecycle.claim(100, now, now.plusSeconds(300))).isEmpty();
        assertThat(lifecycle.reconcile(100, now)).isZero();
    }

    @Test
    void reconciliationRecoversHistoricalTerminalWithoutAnIntentAndDoesNotTouchCancelPending() {
        var failed = newJob();
        var active = prepareRendering();
        transaction.executeWithoutResult(ignored -> gateway.cancel(active.installationId(), active.jobRef(), now));
        jdbc.sql("UPDATE processing_jobs SET status = 'FAILED', error_code = 'dispatch-unavailable' WHERE id = :id")
            .param("id", failed.id()).update();
        assertThat(lifecycle.reconcile(1, now)).isEqualTo(1);
        assertThat(lifecycle.reconcile(1, now)).isZero();
        var claim = lifecycle.claim(100, now, now.plusSeconds(300)).getFirst();
        assertThat(claim.jobId()).isEqualTo(failed.id());
        assertThat(claim.objectKeys()).hasSize(1);
        assertThat(rendering.find(active.jobRef()).status()).isEqualTo(JobStatus.CANCEL_PENDING);
    }

    @Test
    void lifecycleLeaseSurvivesCrashAndOldCompletionCannotAcknowledgeNewClaim() {
        var job = prepareRendering();
        rendering.failUnclaimed(job.id(), GatewayErrorCode.INTERNAL_ERROR, now);
        var first = lifecycle.claim(1, now, now.plusSeconds(300)).getFirst();
        assertThat(lifecycle.claim(1, now.plusSeconds(299), now.plusSeconds(599))).isEmpty();
        var second = lifecycle.claim(1, now.plusSeconds(300), now.plusSeconds(600)).getFirst();
        assertThat(lifecycle.complete(job.id(), first.leaseUntil(), now.plusSeconds(301))).isFalse();
        lifecycle.reschedule(job.id(), first.leaseUntil(), now.plusSeconds(361));
        assertThat(lifecycle.claim(1, now.plusSeconds(361), now.plusSeconds(661))).isEmpty();
        assertThat(lifecycle.complete(job.id(), second.leaseUntil(), now.plusSeconds(362))).isTrue();
    }

    @Test
    void lifecycleClaimersSkipRowsLockedByAnotherConnection() throws Exception {
        var first = newJob();
        var second = newJob();
        jdbc.sql("UPDATE processing_jobs SET status = 'FAILED', error_code = 'dispatch-unavailable'").update();
        lifecycle.reconcile(100, now);
        var locked = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        try (var pool = Executors.newSingleThreadExecutor()) {
            var holder = pool.submit(() -> transaction.executeWithoutResult(ignored -> {
                jdbc.sql("SELECT job_id FROM processing_job_lifecycle_cleanups WHERE job_id = :id FOR UPDATE")
                    .param("id", first.id()).query(UUID.class).single();
                locked.countDown();
                try { assertThat(release.await(10, TimeUnit.SECONDS)).isTrue(); }
                catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new AssertionError(error); }
            }));
            try {
                assertThat(locked.await(10, TimeUnit.SECONDS)).isTrue();
                assertThat(lifecycle.claim(100, now, now.plusSeconds(300)))
                    .extracting(LifecycleCleanupRepository.CleanupClaim::jobId).containsExactly(second.id());
            } finally { release.countDown(); }
            holder.get(10, TimeUnit.SECONDS);
        }
        assertThat(lifecycle.claim(100, now, now.plusSeconds(300)))
            .extracting(LifecycleCleanupRepository.CleanupClaim::jobId).containsExactly(first.id());
    }

    @Test
    void lifecycleSchemaRejectsInvalidScopeTimesAndCascadesWithoutRedundantFkIndex() {
        var job = newJob();
        assertThatThrownBy(() -> jdbc.sql("""
                INSERT INTO processing_job_lifecycle_cleanups (job_id, cleanup_scope, requested_at, next_attempt_at)
                VALUES (:id, 'INVALID', :now, :now)
                """).param("id", job.id()).param("now", timestamp(now)).update())
            .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.sql("""
                INSERT INTO processing_job_lifecycle_cleanups (job_id, cleanup_scope, requested_at, next_attempt_at)
                VALUES (:id, 'ALL', :now, :before)
                """).param("id", job.id()).param("now", timestamp(now)).param("before", timestamp(now.minusSeconds(1))).update())
            .isInstanceOf(DataIntegrityViolationException.class);
        jdbc.sql("UPDATE processing_jobs SET status = 'FAILED', error_code = 'dispatch-unavailable' WHERE id = :id")
            .param("id", job.id()).update();
        lifecycle.reconcile(100, now);
        assertThat(jdbc.sql("SELECT indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'processing_job_lifecycle_cleanups'")
            .query(String.class).list()).hasSize(2);
        jdbc.sql("DELETE FROM anonymous_installations WHERE id = :id").param("id", job.installationId()).update();
        assertThat(lifecycle.claim(100, now, now.plusSeconds(300))).isEmpty();
    }

    @ParameterizedTest
    @ValueSource(strings = {"cancel", "dispatch", "ocr-invalid", "ocr-running", "translation-invalid", "translation-running"})
    void everyIndividualTerminalPathQueuesCleanupInItsOwnTransaction(String path) {
        var job = newJob();
        switch (path) {
            case "cancel" -> cancelJob.execute(job.installationId(), job.jobRef());
            case "dispatch" -> terminalControl(path, job);
            case "ocr-invalid" -> ocr.failUnclaimed(job.id(), GatewayErrorCode.OCR_INVALID_MEDIA, now);
            case "ocr-running" -> {
                ocr.claim(job.jobRef(), now);
                ocr.fail(job.id(), GatewayErrorCode.OCR_UNAVAILABLE, now);
            }
            default -> {
                ocr.claim(job.jobRef(), now);
                ocr.complete(job.id(), "private/ocr/" + job.id(), "a".repeat(64), now);
                if (path.equals("translation-running")) translation.claim(job.jobRef(), now);
                if (path.equals("translation-running")) translation.fail(job.id(), GatewayErrorCode.TRANSLATION_UNAVAILABLE, now);
                else translation.failUnclaimed(job.id(), GatewayErrorCode.TRANSLATION_INVALID_RESPONSE, now);
            }
        }
        var at = Instant.now().plusSeconds(1);
        assertThat(lifecycle.reconcile(100, at)).isZero();
        var claims = lifecycle.claim(100, at, at.plusSeconds(300));
        if (path.equals("cancel") || path.equals("dispatch")) {
            assertThat(claims).isEmpty();
            verify(cleanupStorage).delete(rendering.find(job.jobRef()).originalObjectKey());
            assertThat(jdbc.sql("SELECT completed_at IS NOT NULL FROM processing_job_lifecycle_cleanups WHERE job_id = :id")
                .param("id", job.id()).query(Boolean.class).single()).isTrue();
        } else {
            assertThat(claims).hasSize(1);
            assertThat(claims.getFirst().jobId()).isEqualTo(job.id());
            assertThat(claims.getFirst().objectKeys()).contains(rendering.find(job.jobRef()).originalObjectKey());
        }
        assertThat(jdbc.sql("SELECT cleanup_scope FROM processing_job_lifecycle_cleanups WHERE job_id = :id")
            .param("id", job.id()).query(String.class).single()).isEqualTo("ALL");
    }

    @Test
    void latePreclaimFailureCannotEnqueueDeletionOfAnotherRunningDelivery() {
        var job = prepareRendering();
        rendering.claim(job.jobRef(), now);
        ocr.failUnclaimed(job.id(), GatewayErrorCode.OCR_INVALID_MEDIA, now);
        translation.failUnclaimed(job.id(), GatewayErrorCode.TRANSLATION_INVALID_RESPONSE, now);
        rendering.failUnclaimed(job.id(), GatewayErrorCode.INTERNAL_ERROR, now);
        assertThat(lifecycle.reconcile(100, now)).isZero();
        assertThat(lifecycle.claim(100, now, now.plusSeconds(300))).isEmpty();
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.RENDERING);
    }

    @Test
    void staleRunningCancellationIsReconciledWithoutRepeatingAProvider() {
        var job = prepareRendering();
        rendering.claim(job.jobRef(), now);
        transaction.executeWithoutResult(ignored -> gateway.cancel(job.installationId(), job.jobRef(), now));
        assertThat(lifecycle.reconcile(100, now)).isZero();
        assertThat(rendering.failStale(now.plusSeconds(1), now.plusSeconds(901), 100)).hasSize(1);
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.CANCELLED);
        assertThat(lifecycle.reconcile(100, now.plusSeconds(901))).isEqualTo(1);
        assertThat(lifecycle.claim(100, now.plusSeconds(901), now.plusSeconds(1201))).hasSize(1);
    }

    @Test
    void lifecycleQueriesHaveBoundedLocksAndExistingIndexPaths() {
        var job = newJob();
        jdbc.sql("UPDATE processing_jobs SET status = 'FAILED', error_code = 'dispatch-unavailable' WHERE id = :id")
            .param("id", job.id()).update();
        transaction.executeWithoutResult(ignored -> {
            // Tiny fixtures otherwise legitimately favor sequential scans; inspect available index paths as well.
            jdbc.sql("SET LOCAL enable_seqscan = off").update();
            var explain = jdbc.sql("EXPLAIN (ANALYZE, COSTS OFF, TIMING OFF) " + JdbcLifecycleCleanupRepository.RECONCILIATION_CANDIDATES)
                .param("limit", 100).query(String.class).list();
            assertThat(String.join("\n", explain)).contains("Limit", "LockRows", "Index", "processing_jobs", "lifecycle_cleanups");
        });
        assertThat(lifecycle.reconcile(100, now)).isEqualTo(1);
        assertThatThrownBy(() -> lifecycle.claim(101, now, now.plusSeconds(300)))
            .isInstanceOf(InvalidDataAccessApiUsageException.class).hasCauseInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> lifecycle.reconcile(0, now))
            .isInstanceOf(InvalidDataAccessApiUsageException.class).hasCauseInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> lifecycle.claim(1, now, now))
            .isInstanceOf(InvalidDataAccessApiUsageException.class).hasCauseInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void readyDownloadProjectionIsPrivateAndSignerRunsOutsideEvenAnOuterTransaction() {
        var job = readyDownloadJob();
        when(signer.sign(any())).thenAnswer(call -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            return signed(call.getArgument(0));
        });
        var result = transaction.execute(ignored -> getJobResult.byRef(job.installationId(), job.jobRef()));
        assertThat(result.result().image().sha256()).isEqualTo("c".repeat(64));
        assertThat(result.result().manifest().sha256()).isEqualTo("d".repeat(64));
        assertThat(result.result().widthPx()).isEqualTo(100);
        assertThat(result.result().expiresAt()).isEqualTo(now.plusSeconds(3600));
        assertThat(getJobResult.byIdempotency(job.installationId(), job.idempotencyKey()).result()).isNotNull();
        var otherOwner = transaction.execute(ignored -> resultDownloads.findReady(UUID.randomUUID(), job.jobRef()));
        assertThat(otherOwner).isEmpty();
        assertThatThrownBy(() -> getJobResult.byRef(UUID.randomUUID(), job.jobRef())).isInstanceOf(GatewayException.class)
            .hasMessage("job-not-found");
        verify(signer, times(4)).sign(any());
    }

    @Test
    void ackFromAnotherConnectionDuringSigningDoesNotWaitForADatabaseTransaction() throws Exception {
        var job = readyDownloadJob();
        try (var executor = Executors.newSingleThreadExecutor()) {
            when(signer.sign(any())).thenAnswer(call -> {
                assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
                executor.submit(() -> transaction.executeWithoutResult(ignored ->
                    acknowledgementRepository.request(job.installationId(), job.jobRef(), now))).get(5, TimeUnit.SECONDS);
                return signed(call.getArgument(0));
            });
            var result = getJobResult.byRef(job.installationId(), job.jobRef());
            assertThat(result.job().status()).isEqualTo(JobStatus.RESULT_EXPIRED);
            assertThat(result.result()).isNull();
        }
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_result_acknowledgements WHERE job_id = :id")
            .param("id", job.id()).query(Long.class).single()).isOne();
    }

    @Test
    void expiryDiscoveredAfterSigningQueuesCleanupAndReturnsNoUrls() {
        var job = readyDownloadJob();
        when(signer.sign(any())).thenAnswer(call -> {
            // Simulate an elapsed result deadline without a one-hour blocking test.
            jdbc.sql("UPDATE processing_job_stages SET started_at = :started, completed_at = :completed, result_expires_at = :completed + INTERVAL '1 hour' WHERE job_id = :id AND stage = 'RENDERING'")
                .param("started", timestamp(now.minusSeconds(3601))).param("completed", timestamp(now.minusSeconds(3600)))
                .param("id", job.id()).update();
            return signed(call.getArgument(0));
        });
        var result = getJobResult.byRef(job.installationId(), job.jobRef());
        assertThat(result.job().status()).isEqualTo(JobStatus.RESULT_EXPIRED);
        assertThat(result.result()).isNull();
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_result_acknowledgements WHERE job_id = :id")
            .param("id", job.id()).query(Long.class).single()).isOne();
    }

    @Test
    void readyProjectionUsesExistingIndexesAndLocksOnlyTheMatchedOwnerJob() {
        var job = readyDownloadJob();
        var plan = transaction.execute(ignored -> jdbc.sql("EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) "
                + JdbcResultDownloadRepository.READY_PROJECTION)
            .param("owner", job.installationId()).param("ref", job.jobRef()).query(String.class).list());
        assertThat(plan).anyMatch(line -> line.contains("LockRows")).anyMatch(line -> line.contains("Index Scan"));
        System.out.println("Ready result projection EXPLAIN (synthetic local fixture):\n" + String.join("\n", plan));
    }

    private ProcessingJob readyDownloadJob() {
        var job = prepareRendering();
        rendering.claim(job.jobRef(), now);
        assertThat(rendering.complete(job.id(), new RenderingJobRepository.Artifacts("private/rendering/" + job.id() + "/image.webp",
            new RenderedImage("image/webp", 1024, 100, 200, "c".repeat(64)),
            "private/rendering/" + job.id() + "/manifest.json", "d".repeat(64)), now)).isTrue();
        return job;
    }

    private PrivateDownload signed(PrivateDownloadRequest request) {
        return new PrivateDownload(URI.create("https://storage.googleapis.com/test/" + request.objectKey() + "?signature=synthetic"),
            request.kind().mimeType(), 1024, request.sha256(), Instant.now().plusSeconds(120));
    }

    @BeforeEach
    void resetState() {
        jdbc.sql("DELETE FROM anonymous_installations").update();
        now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        when(clock.instant()).thenReturn(now);
    }

    @Test
    void cleanFlywayChainAndExistingPrimaryKeyCoverRenderingMetadata() {
        assertThat(jdbc.sql("SELECT version FROM flyway_schema_history WHERE success ORDER BY installed_rank")
            .query(String.class).list()).containsExactly("1", "2", "3", "4", "5", "6", "7", "8", "9");
        assertThat(jdbc.sql("SELECT indexdef FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'processing_job_stages'")
            .query(String.class).list()).hasSize(1).first().asString().contains("UNIQUE", "job_id, stage");
        var job = prepareRendering();
        var work = rendering.find(job.jobRef());
        assertThat(work.source().sha256()).isEqualTo("0".repeat(64));
        assertThat(work.source().widthPx()).isEqualTo(100);
        assertThat(work.source().heightPx()).isEqualTo(200);
        assertThat(work.sourceLanguage()).isEqualTo("ja");
        assertThat(work.targetLanguage()).isEqualTo("pt-BR");
        assertThat(work.ocrObjectKey()).isEqualTo("private/ocr/" + job.id());
        assertThat(work.translationObjectKey()).isEqualTo("private/translation/" + job.id());
        assertThat(work.createdAt()).isEqualTo(now);
        assertThat(work.artifacts()).isNull();
        assertThat(work.toString()).doesNotContain(job.jobRef().toString(), "private/", "0".repeat(64));
        assertThat(rendering.find(UUID.randomUUID())).isNull();
    }

    @Test
    void additiveUpgradeFromV5PreservesOriginalAndCompletedInputStages() {
        var job = prepareRendering();
        Flyway.configure().dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
            .schemas("render_upgrade").defaultSchema("render_upgrade").target(MigrationVersion.fromVersion("5"))
            .load().migrate();
        var dataSource = new DriverManagerDataSource(POSTGRES.getJdbcUrl() + "&currentSchema=render_upgrade",
            POSTGRES.getUsername(), POSTGRES.getPassword());
        var legacy = JdbcClient.create(dataSource);
        legacy.sql("INSERT INTO anonymous_installations SELECT * FROM public.anonymous_installations WHERE id = :id")
            .param("id", job.installationId()).update();
        var columns = legacy.sql("SELECT column_name FROM information_schema.columns WHERE table_schema = 'render_upgrade' AND table_name = 'processing_jobs' ORDER BY ordinal_position")
            .query(String.class).list();
        legacy.sql("INSERT INTO processing_jobs (" + String.join(",", columns) + ") SELECT " + String.join(",", columns) + " FROM public.processing_jobs WHERE id = :id")
            .param("id", job.id()).update();
        legacy.sql("""
                INSERT INTO processing_job_stages
                SELECT job_id, stage, status, started_at, completed_at, error_code, billable_unit, output_object_key, output_sha256
                FROM public.processing_job_stages WHERE job_id = :id
                """).param("id", job.id()).update();
        Flyway.configure().dataSource(POSTGRES.getJdbcUrl(), POSTGRES.getUsername(), POSTGRES.getPassword())
            .schemas("render_upgrade").defaultSchema("render_upgrade").load().migrate();
        var repository = new JdbcRenderingJobRepository(legacy, new JdbcOriginalRetention(legacy, Clock.systemUTC()));
        var upgraded = repository.find(job.jobRef()).orElseThrow();
        assertThat(upgraded).isEqualTo(rendering.find(job.jobRef()));
        assertThat(upgraded.artifacts()).isNull();
        assertThat(legacy.sql("SELECT version FROM flyway_schema_history WHERE success AND version IS NOT NULL ORDER BY installed_rank")
            .query(String.class).list()).containsExactly("1", "2", "3", "4", "5", "6", "7", "8", "9");
    }

    @Test
    void concurrentDeliveriesReserveOneStageAndCommitBothArtifactsOnce() throws Exception {
        var job = prepareRendering();
        var start = new CountDownLatch(1);
        var requests = IntStream.range(0, 16).<Callable<RenderingJobRepository.Claim>>mapToObj(ignored -> () -> {
            assertThat(start.await(10, TimeUnit.SECONDS)).isTrue();
            return rendering.claim(job.jobRef(), now.plusSeconds(1));
        }).toList();
        try (var pool = Executors.newFixedThreadPool(16)) {
            var futures = requests.stream().map(pool::submit).toList();
            start.countDown();
            var results = futures.stream().map(future -> {
                try { return future.get(10, TimeUnit.SECONDS); }
                catch (Exception failure) { throw new AssertionError("Rendering claim did not finish", failure); }
            }).toList();
            assertThat(results).filteredOn(RenderingJobRepository.Claim.STARTED::equals).hasSize(1);
            assertThat(results).filteredOn(RenderingJobRepository.Claim.ALREADY_HANDLED::equals).hasSize(15);
        }
        var output = artifacts(job.id());
        assertThat(rendering.complete(job.id(), output, now.plusSeconds(2))).isTrue();
        var completed = rendering.find(job.jobRef());
        assertThat(completed.status()).isEqualTo(JobStatus.READY);
        assertThat(completed.artifacts()).isEqualTo(output);
        assertThat(stageStatus(job.id())).isEqualTo("SUCCEEDED");
        assertThat(rendering.complete(job.id(), artifacts(UUID.randomUUID()), now.plusSeconds(3))).isFalse();
        rendering.failUnclaimed(job.id(), GatewayErrorCode.INTERNAL_ERROR, now.plusSeconds(4));
        rendering.fail(job.id(), GatewayErrorCode.INTERNAL_ERROR, now.plusSeconds(4));
        assertThat(rendering.find(job.jobRef())).isEqualTo(completed);
    }

    @Test
    void rollbackLeavesRunningStageWithoutEitherArtifactOrReadyJob() {
        var job = prepareRendering();
        rendering.claim(job.jobRef(), now.plusSeconds(1));
        assertThatThrownBy(() -> transaction.executeWithoutResult(ignored -> {
            assertThat(renderingRepository.complete(job.id(), artifacts(job.id()), now.plusSeconds(2))).isTrue();
            throw new IllegalStateException("synthetic rollback");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.RENDERING);
        assertThat(rendering.find(job.jobRef()).artifacts()).isNull();
        assertThat(stageStatus(job.id())).isEqualTo("RUNNING");
        assertThat(jdbc.sql("SELECT output_object_key FROM processing_job_stages WHERE job_id = :id AND stage = 'RENDERING'")
            .param("id", job.id()).query().singleRow().get("output_object_key")).isNull();
    }

    @ParameterizedTest
    @ValueSource(strings = {"before", "during-complete", "during-fail"})
    void cancellationHasNoFinalArtifactAndNeverProducesReady(String boundary) {
        var job = prepareRendering();
        if (!boundary.equals("before")) rendering.claim(job.jobRef(), now.plusSeconds(1));
        transaction.executeWithoutResult(ignored -> gateway.cancel(job.installationId(), job.jobRef(), now.plusSeconds(2)));
        if (boundary.equals("before")) {
            assertThat(rendering.claim(job.jobRef(), now.plusSeconds(3))).isEqualTo(RenderingJobRepository.Claim.CANCELLED);
        } else {
            assertThat(rendering.claim(job.jobRef(), now.plusSeconds(3))).isEqualTo(RenderingJobRepository.Claim.ALREADY_HANDLED);
            assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.CANCEL_PENDING);
            if (boundary.equals("during-complete")) {
                assertThat(rendering.complete(job.id(), artifacts(job.id()), now.plusSeconds(4))).isFalse();
            } else rendering.fail(job.id(), GatewayErrorCode.INTERNAL_ERROR, now.plusSeconds(4));
            assertThat(stageStatus(job.id())).isEqualTo("CANCELLED");
        }
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.CANCELLED);
        assertThat(rendering.find(job.jobRef()).artifacts()).isNull();
        assertThat(rendering.claim(job.jobRef(), now.plusSeconds(5))).isEqualTo(RenderingJobRepository.Claim.ALREADY_HANDLED);
    }

    @Test
    void cancellationRedeliveryCannotCancelAnActiveStageFromAnyPipelineDelivery() {
        var rendered = prepareRendering();
        rendering.claim(rendered.jobRef(), now.plusSeconds(1));
        transaction.executeWithoutResult(ignored -> gateway.cancel(rendered.installationId(), rendered.jobRef(), now.plusSeconds(2)));
        assertThat(ocr.claim(rendered.jobRef(), now.plusSeconds(3))).isEqualTo(OcrJobRepository.Claim.ALREADY_HANDLED);
        assertThat(translation.claim(rendered.jobRef(), now.plusSeconds(3))).isEqualTo(TranslationJobRepository.Claim.ALREADY_HANDLED);
        assertThat(ocr.complete(rendered.id(), "private/ocr/late", "e".repeat(64), now.plusSeconds(3))).isFalse();
        ocr.fail(rendered.id(), GatewayErrorCode.OCR_UNAVAILABLE, now.plusSeconds(3));
        assertThat(translation.complete(rendered.id(), "private/translation/late", "e".repeat(64), now.plusSeconds(3))).isFalse();
        translation.fail(rendered.id(), GatewayErrorCode.TRANSLATION_UNAVAILABLE, now.plusSeconds(3));
        rendering.failUnclaimed(rendered.id(), GatewayErrorCode.INTERNAL_ERROR, now.plusSeconds(3));
        assertThat(rendering.find(rendered.jobRef()).status()).isEqualTo(JobStatus.CANCEL_PENDING);
        assertThat(stageStatus(rendered.id())).isEqualTo("RUNNING");

        var ocrRunning = newJob();
        ocr.claim(ocrRunning.jobRef(), now.plusSeconds(1));
        transaction.executeWithoutResult(ignored -> gateway.cancel(ocrRunning.installationId(), ocrRunning.jobRef(), now.plusSeconds(2)));
        assertThat(rendering.claim(ocrRunning.jobRef(), now.plusSeconds(3))).isEqualTo(RenderingJobRepository.Claim.ALREADY_HANDLED);
        assertThat(rendering.find(ocrRunning.jobRef()).status()).isEqualTo(JobStatus.CANCEL_PENDING);
        var translating = newJob();
        ocr.claim(translating.jobRef(), now);
        ocr.complete(translating.id(), "private/ocr/cancel", "a".repeat(64), now);
        translation.claim(translating.jobRef(), now.plusSeconds(1));
        transaction.executeWithoutResult(ignored -> gateway.cancel(translating.installationId(), translating.jobRef(), now.plusSeconds(2)));
        rendering.failUnclaimed(translating.id(), GatewayErrorCode.INTERNAL_ERROR, now.plusSeconds(3));
        assertThat(rendering.claim(translating.jobRef(), now.plusSeconds(3))).isEqualTo(RenderingJobRepository.Claim.ALREADY_HANDLED);
        assertThat(rendering.find(translating.jobRef()).status()).isEqualTo(JobStatus.CANCEL_PENDING);
    }

    @Test
    void unclaimedFailureDoesNotOwnSomeoneElsesRunningStageAndOwnedFailureIsTerminal() {
        var invalid = prepareRendering();
        rendering.fail(invalid.id(), GatewayErrorCode.INTERNAL_ERROR, now.plusSeconds(1));
        assertThat(rendering.find(invalid.jobRef()).status()).isEqualTo(JobStatus.RENDERING);
        rendering.failUnclaimed(invalid.id(), GatewayErrorCode.INTERNAL_ERROR, now.plusSeconds(1));
        assertThat(rendering.find(invalid.jobRef()).status()).isEqualTo(JobStatus.FAILED);
        assertThat(stageStatus(invalid.id())).isEqualTo("FAILED");
        assertThat(rendering.claim(invalid.jobRef(), now.plusSeconds(2))).isEqualTo(RenderingJobRepository.Claim.ALREADY_HANDLED);
        var running = prepareRendering();
        rendering.claim(running.jobRef(), now.plusSeconds(1));
        rendering.failUnclaimed(running.id(), GatewayErrorCode.INTERNAL_ERROR, now.plusSeconds(2));
        assertThat(rendering.find(running.jobRef()).status()).isEqualTo(JobStatus.RENDERING);
        assertThat(stageStatus(running.id())).isEqualTo("RUNNING");
        rendering.fail(running.id(), GatewayErrorCode.INTERNAL_ERROR, now.plusSeconds(3));
        assertThat(rendering.find(running.jobRef()).status()).isEqualTo(JobStatus.FAILED);
        assertThat(rendering.find(running.jobRef()).artifacts()).isNull();
    }

    @Test
    void failureAndClaimSerializeWithoutTurningAnOwnedStageIntoAnUnclaimedFailure() throws Exception {
        var job = prepareRendering();
        try (var pool = Executors.newFixedThreadPool(2)) {
            var start = new CountDownLatch(1);
            var claim = pool.submit(() -> { start.await(); return rendering.claim(job.jobRef(), now.plusSeconds(1)); });
            var failure = pool.submit(() -> {
                start.await();
                rendering.failUnclaimed(job.id(), GatewayErrorCode.INTERNAL_ERROR, now.plusSeconds(1));
                return true;
            });
            start.countDown();
            var result = claim.get(10, TimeUnit.SECONDS);
            failure.get(10, TimeUnit.SECONDS);
            boolean started = result == RenderingJobRepository.Claim.STARTED;
            assertThat(rendering.find(job.jobRef()).status()).isEqualTo(started ? JobStatus.RENDERING : JobStatus.FAILED);
            assertThat(stageStatus(job.id())).isEqualTo(started ? "RUNNING" : "FAILED");
        }
    }

    @Test
    void abandonedStageFailsOrCancelsOnceWithBoundaryAndBatchLimits() {
        var first = prepareRendering();
        var cancelled = prepareRendering();
        var recent = prepareRendering();
        var untouched = prepareRendering();
        rendering.claim(first.jobRef(), now.plusSeconds(1));
        rendering.claim(cancelled.jobRef(), now.plusSeconds(2));
        rendering.claim(recent.jobRef(), now.plusSeconds(3));
        transaction.executeWithoutResult(ignored -> gateway.cancel(cancelled.installationId(), cancelled.jobRef(), now.plusSeconds(4)));
        var oldest = rendering.failStale(now.plusSeconds(3), now.plusSeconds(903), 1);
        assertThat(oldest).containsExactly(rendering.find(first.jobRef()).originalObjectKey());
        assertThat(rendering.find(first.jobRef()).status()).isEqualTo(JobStatus.FAILED);
        assertThat(rendering.find(cancelled.jobRef()).status()).isEqualTo(JobStatus.CANCEL_PENDING);
        assertThat(rendering.failStale(now.plusSeconds(3), now.plusSeconds(904), 100))
            .containsExactly(rendering.find(cancelled.jobRef()).originalObjectKey());
        assertThat(rendering.find(cancelled.jobRef()).status()).isEqualTo(JobStatus.CANCELLED);
        assertThat(rendering.find(recent.jobRef()).status()).isEqualTo(JobStatus.RENDERING);
        assertThat(stageStatus(recent.id())).isEqualTo("RUNNING");
        assertThat(rendering.find(untouched.jobRef()).artifacts()).isNull();
        assertThat(rendering.failStale(now.plusSeconds(3), now.plusSeconds(905), 100)).isEmpty();
        assertThatThrownBy(() -> rendering.failStale(now, now, 0)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> rendering.failStale(now, now, 101)).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void staleCleanupSkipsAJobLockedByAnotherDeliveryAndReclaimsItLater() throws Exception {
        var locked = prepareRendering();
        var available = prepareRendering();
        rendering.claim(locked.jobRef(), now.plusSeconds(1));
        rendering.claim(available.jobRef(), now.plusSeconds(2));
        var entered = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        try (var pool = Executors.newSingleThreadExecutor()) {
            var holding = pool.submit(() -> transaction.executeWithoutResult(ignored -> {
                jdbc.sql("SELECT id FROM processing_jobs WHERE id = :id FOR UPDATE").param("id", locked.id()).query(UUID.class).single();
                entered.countDown();
                try { assertThat(release.await(10, TimeUnit.SECONDS)).isTrue(); }
                catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new AssertionError(error); }
            }));
            try {
                assertThat(entered.await(10, TimeUnit.SECONDS)).isTrue();
                assertThat(rendering.failStale(now.plusSeconds(3), now.plusSeconds(903), 100))
                    .containsExactly(rendering.find(available.jobRef()).originalObjectKey());
                assertThat(rendering.find(locked.jobRef()).status()).isEqualTo(JobStatus.RENDERING);
            } finally { release.countDown(); }
            holding.get(10, TimeUnit.SECONDS);
        }
        assertThat(rendering.failStale(now.plusSeconds(3), now.plusSeconds(904), 100))
            .containsExactly(rendering.find(locked.jobRef()).originalObjectKey());
        assertThat(rendering.find(locked.jobRef()).status()).isEqualTo(JobStatus.FAILED);
    }

    @ParameterizedTest
    @ValueSource(strings = {"OCR", "TRANSLATING", "RENDERING"})
    void staleScanCannotLockTheStageOfAJobItSkipped(String stage) throws Exception {
        var job = newJob();
        assertThat(ocr.claim(job.jobRef(), now)).isEqualTo(OcrJobRepository.Claim.STARTED);
        if (!stage.equals("OCR")) {
            assertThat(ocr.complete(job.id(), "private/ocr/" + job.id(), "a".repeat(64), now)).isTrue();
            assertThat(translation.claim(job.jobRef(), now)).isEqualTo(TranslationJobRepository.Claim.STARTED);
        }
        if (stage.equals("RENDERING")) {
            assertThat(translation.complete(job.id(), "private/translation/" + job.id(), "b".repeat(64), now)).isTrue();
            assertThat(rendering.claim(job.jobRef(), now)).isEqualTo(RenderingJobRepository.Claim.STARTED);
        }
        var scanned = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var cleanup = new AtomicReference<Future<?>>();
        try (var pool = Executors.newSingleThreadExecutor()) {
            try {
                transaction.executeWithoutResult(ignored -> {
                    jdbc.sql("SELECT id FROM processing_jobs WHERE id = :id FOR UPDATE")
                        .param("id", job.id()).query(UUID.class).single();
                    cleanup.set(pool.submit(() -> transaction.executeWithoutResult(scan -> {
                        switch (stage) {
                            case "OCR" -> assertThat(ocr.failStale(now.plusSeconds(1), now.plusSeconds(901), 100)).isEmpty();
                            case "TRANSLATING" -> assertThat(translation.failStale(now.plusSeconds(1), now.plusSeconds(901), 100)).isZero();
                            case "RENDERING" -> assertThat(rendering.failStale(now.plusSeconds(1), now.plusSeconds(901), 100)).isEmpty();
                            default -> throw new AssertionError("unexpected-stage");
                        }
                        scanned.countDown();
                        try { assertThat(release.await(10, TimeUnit.SECONDS)).isTrue(); }
                        catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new AssertionError(error); }
                    })));
                    try { assertThat(scanned.await(10, TimeUnit.SECONDS)).isTrue(); }
                    catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new AssertionError(error); }
                    // A skipped job must not leave a stage lock behind while cleanup scans other jobs.
                    jdbc.sql("SELECT job_id FROM processing_job_stages WHERE job_id = :id AND stage = :stage FOR UPDATE NOWAIT")
                        .param("id", job.id()).param("stage", stage).query(UUID.class).single();
                    assertThat(jdbc.sql("SELECT status FROM processing_jobs WHERE id = :id")
                        .param("id", job.id()).query(String.class).single()).isEqualTo(stage);
                    assertThat(jdbc.sql("SELECT status FROM processing_job_stages WHERE job_id = :id AND stage = :stage")
                        .param("id", job.id()).param("stage", stage).query(String.class).single()).isEqualTo("RUNNING");
                    assertThat(jdbc.sql("SELECT COUNT(*) FROM processing_job_lifecycle_cleanups WHERE job_id = :id")
                        .param("id", job.id()).query(Long.class).single()).isZero();
                });
            } finally {
                release.countDown();
                if (cleanup.get() != null) cleanup.get().get(10, TimeUnit.SECONDS);
            }
        }
        switch (stage) {
            case "OCR" -> assertThat(ocr.failStale(now.plusSeconds(1), now.plusSeconds(902), 100)).hasSize(1);
            case "TRANSLATING" -> assertThat(translation.failStale(now.plusSeconds(1), now.plusSeconds(902), 100)).isOne();
            case "RENDERING" -> assertThat(rendering.failStale(now.plusSeconds(1), now.plusSeconds(902), 100)).hasSize(1);
            default -> throw new AssertionError("unexpected-stage");
        }
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.FAILED);
        verifyNoInteractions(cleanupStorage);
    }

    @Test
    void inspectTheActualBoundedCleanupQueryPlanWithoutLoggingObjectReferences() {
        var job = prepareRendering();
        rendering.claim(job.jobRef(), now.plusSeconds(1));
        var plan = transaction.execute(ignored -> jdbc.sql("EXPLAIN (ANALYZE, COSTS FALSE, TIMING FALSE, SUMMARY FALSE) "
                + JdbcRenderingJobRepository.STALE_CLAIM_SQL)
            .param("cutoff", timestamp(now.plusSeconds(2))).param("limit", 100).query(String.class).list());
        assertThat(plan).isNotEmpty().anyMatch(line -> line.contains("LockRows"))
            .noneMatch(line -> line.contains("private/"));
        // EXPLAIN contains operators and fixed status predicates only, not content or object keys.
        System.out.println("Rendering cleanup EXPLAIN (synthetic local fixture):\n" + String.join("\n", plan));
        assertThat(stageStatus(job.id())).isEqualTo("RUNNING");
    }

    @Test
    void acknowledgementRetainsCommitProofAndClaimsBothArtifactsWithExistingInputs() {
        var job = prepareRendering();
        rendering.claim(job.jobRef(), now.plusSeconds(1));
        var output = artifacts(job.id());
        assertThat(rendering.complete(job.id(), output, now.plusSeconds(2))).isTrue();
        transaction.executeWithoutResult(ignored -> acknowledgementRepository.request(job.installationId(), job.jobRef(), now.plusSeconds(3)));
        var expired = rendering.find(job.jobRef());
        assertThat(expired.status()).isEqualTo(JobStatus.RESULT_EXPIRED);
        assertThat(expired.artifacts()).isEqualTo(output);
        var claims = acknowledgements.claim(100, now.plusSeconds(3), now.plusSeconds(63));
        assertThat(claims).hasSize(1);
        assertThat(claims.getFirst().objectKeys()).containsExactlyInAnyOrder(expired.originalObjectKey(),
            expired.ocrObjectKey(), expired.translationObjectKey(), output.imageObjectKey(), output.manifestObjectKey());
        assertThat(rendering.claim(job.jobRef(), now.plusSeconds(4))).isEqualTo(RenderingJobRepository.Claim.ALREADY_HANDLED);
        jdbc.sql("DELETE FROM anonymous_installations WHERE id = :id").param("id", job.installationId()).update();
        assertThat(rendering.find(job.jobRef())).isNull();
        assertThat(jdbc.sql("SELECT COUNT(*) FROM processing_job_stages WHERE job_id = :id")
            .param("id", job.id()).query(Long.class).single()).isZero();
        assertThat(jdbc.sql("SELECT COUNT(*) FROM processing_job_result_acknowledgements WHERE job_id = :id")
            .param("id", job.id()).query(Long.class).single()).isZero();
    }

    @ParameterizedTest
    @ValueSource(strings = {"missing-image", "missing-hash", "missing-size", "bad-hash", "zero", "large", "blank",
        "alias", "running", "other-stage", "missing-manifest", "blank-manifest"})
    void migrationRejectsIncompleteOrIncompatibleSuccessMetadata(String invalid) {
        var job = prepareRendering();
        rendering.claim(job.jobRef(), now.plusSeconds(1));
        String key = invalid.equals("missing-image") ? null : invalid.equals("blank") ? " " : "private/render/final.webp";
        String hash = invalid.equals("missing-hash") ? null : invalid.equals("bad-hash") ? "Z".repeat(64) : "c".repeat(64);
        Long size = invalid.equals("missing-size") ? null : invalid.equals("zero") ? 0L
            : invalid.equals("large") ? RenderPolicy.MAX_OUTPUT_BYTES + 1 : 1024L;
        String manifest = invalid.equals("missing-manifest") ? null : invalid.equals("blank-manifest") ? " "
            : invalid.equals("alias") ? key : "private/render/final.json";
        String manifestHash = invalid.equals("missing-manifest") ? null : "d".repeat(64);
        assertThatThrownBy(() -> jdbc.sql("""
                UPDATE processing_job_stages SET status = :status, completed_at = :completed,
                    output_object_key = :manifest, output_sha256 = :manifestHash,
                    rendered_image_object_key = :key, rendered_image_sha256 = :hash, rendered_image_byte_size = :size
                WHERE job_id = :id AND stage = :stage
                """).param("id", job.id()).param("stage", invalid.equals("other-stage") ? "OCR" : "RENDERING")
            .param("status", invalid.equals("running") ? "RUNNING" : "SUCCEEDED")
            .param("completed", invalid.equals("running") ? null : timestamp(now.plusSeconds(2)))
            .param("key", key).param("hash", hash).param("size", size)
            .param("manifest", manifest).param("manifestHash", manifestHash).update())
            .isInstanceOf(DataIntegrityViolationException.class);
        assertThat(stageStatus(job.id())).isEqualTo("RUNNING");
    }

    @ParameterizedTest
    @ValueSource(strings = {"dimensions", "original", "ocr", "translation"})
    void repositoryRejectsMetadataNotBoundToItsOwnOriginalAndInputArtifacts(String invalid) {
        var job = prepareRendering();
        rendering.claim(job.jobRef(), now.plusSeconds(1));
        var work = rendering.find(job.jobRef());
        var key = switch (invalid) {
            case "original" -> work.originalObjectKey();
            case "ocr" -> work.ocrObjectKey();
            case "translation" -> work.translationObjectKey();
            default -> "private/render/image.webp";
        };
        var bad = new RenderingJobRepository.Artifacts(key, new RenderedImage("image/webp", 1024,
            invalid.equals("dimensions") ? 101 : 100, 200, "c".repeat(64)), "private/render/manifest.json", "d".repeat(64));
        assertThatThrownBy(() -> rendering.complete(job.id(), bad, now.plusSeconds(2))).isInstanceOf(RenderValidationException.class);
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.RENDERING);
        assertThat(rendering.find(job.jobRef()).artifacts()).isNull();
    }

    @Test
    void claimOnlyRenderingAndCompleteOnlyOwnedStagesWithoutCrossJobMutation() {
        var untouched = newJob();
        assertThat(rendering.claim(untouched.jobRef(), now.plusSeconds(1))).isEqualTo(RenderingJobRepository.Claim.ALREADY_HANDLED);
        assertThat(rendering.claim(UUID.randomUUID(), now.plusSeconds(1))).isEqualTo(RenderingJobRepository.Claim.ALREADY_HANDLED);
        var job = prepareRendering();
        assertThat(rendering.complete(job.id(), artifacts(job.id()), now.plusSeconds(2))).isFalse();
        rendering.claim(job.jobRef(), now.plusSeconds(3));
        assertThat(rendering.complete(job.id(), artifacts(job.id()), now.plusSeconds(4))).isTrue();
        assertThat(rendering.find(untouched.jobRef()).status()).isEqualTo(JobStatus.QUEUED);
        assertThatThrownBy(() -> new RenderingJobRepository.Artifacts("private/same", new RenderedImage("image/webp",
            1024, 100, 200, "c".repeat(64)), "private/same", "d".repeat(64))).isInstanceOf(RenderValidationException.class);
        assertThat(artifacts(job.id()).toString()).doesNotContain(job.id().toString(), "private/", "c".repeat(64));
    }

    @Test
    void preclaimOcrFailureCannotEndAnotherRunningOwner() {
        var job = newJob();
        assertThat(ocr.claim(job.jobRef(), now)).isEqualTo(OcrJobRepository.Claim.STARTED);
        ocr.failUnclaimed(job.id(), GatewayErrorCode.OCR_INVALID_MEDIA, now.plusSeconds(1));
        assertThat(ocr.find(job.jobRef()).status()).isEqualTo(JobStatus.OCR);
        assertThat(jdbc.sql("SELECT status FROM processing_job_stages WHERE job_id = :id AND stage = 'OCR'")
            .param("id", job.id()).query(String.class).single()).isEqualTo("RUNNING");
        assertThat(ocr.complete(job.id(), "private/ocr/owned", "a".repeat(64), now.plusSeconds(2))).isTrue();
    }

    @Test
    void unclaimedOcrFailureCreatesOneTerminalStageButDoesNotChangeLaterStages() {
        var rejected = newJob();
        ocr.failUnclaimed(rejected.id(), GatewayErrorCode.OCR_INVALID_MEDIA, now);
        ocr.failUnclaimed(rejected.id(), GatewayErrorCode.OCR_UNAVAILABLE, now.plusSeconds(1));
        assertThat(ocr.find(rejected.jobRef()).status()).isEqualTo(JobStatus.FAILED);
        assertThat(jdbc.sql("SELECT error_code FROM processing_job_stages WHERE job_id = :id AND stage = 'OCR'")
            .param("id", rejected.id()).query(String.class).single()).isEqualTo("ocr-invalid-media");
        var renderingJob = prepareRendering();
        ocr.failUnclaimed(renderingJob.id(), GatewayErrorCode.OCR_INVALID_MEDIA, now.plusSeconds(1));
        assertThat(rendering.find(renderingJob.jobRef()).status()).isEqualTo(JobStatus.RENDERING);
    }

    @Test
    void exactOcrOutputProofSurvivesLaterRenderingAndAcknowledgement() {
        var job = newJob();
        assertThat(ocr.findOutput(job.id())).isNull();
        assertThat(ocr.findOutput(UUID.randomUUID())).isNull();
        ocr.claim(job.jobRef(), now);
        assertThat(ocr.complete(job.id(), "private/ocr/proof", "a".repeat(64), now)).isTrue();
        var proof = new OcrJobRepository.OutputArtifact("private/ocr/proof", "a".repeat(64));
        assertThat(ocr.findOutput(job.id())).isEqualTo(proof);
        translation.claim(job.jobRef(), now);
        translation.complete(job.id(), "private/translation/proof", "b".repeat(64), now);
        rendering.claim(job.jobRef(), now);
        rendering.complete(job.id(), artifacts(job.id()), now);
        transaction.executeWithoutResult(ignored -> acknowledgementRepository.request(job.installationId(), job.jobRef(), now));
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.RESULT_EXPIRED);
        assertThat(ocr.findOutput(job.id())).isEqualTo(proof);
        assertThat(proof.toString()).isEqualTo("OcrOutputArtifact[redacted]");
    }

    @Test
    void resultExpiresAtRenderingDeadlineNotOriginalDeadlineAndOnlyOnce() {
        var job = prepareRendering();
        rendering.claim(job.jobRef(), now);
        var completedAt = now.plusSeconds(300);
        rendering.complete(job.id(), artifacts(job.id()), completedAt);
        var deadline = completedAt.plusSeconds(3600);
        assertThat(expire(job, deadline.minusMillis(1), completedAt.minusMillis(1))).isFalse();
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.READY);
        assertThat(expire(job, deadline, completedAt)).isTrue();
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.RESULT_EXPIRED);
        assertThat(rendering.find(job.jobRef()).artifacts()).isEqualTo(artifacts(job.id()));
        assertThat(expire(job, deadline.plusSeconds(1), completedAt.plusSeconds(1))).isFalse();
        assertThat(jdbc.sql("SELECT requested_at FROM processing_job_result_acknowledgements WHERE job_id = :id")
            .param("id", job.id()).query(OffsetDateTime.class).single().toInstant()).isEqualTo(deadline);
    }

    @Test
    void ownerScopedQueriesExpireReadyByRefAndIdempotencyButNotOtherInstallations() {
        now = now.minusSeconds(3600);
        when(clock.instant()).thenReturn(now);
        var byRef = readyJob();
        var byKey = readyJob();
        when(clock.instant()).thenReturn(now.plusSeconds(3600));
        assertThatThrownBy(() -> getJob.byRef(byKey.installationId(), byRef.jobRef()))
            .isInstanceOf(GatewayException.class);
        assertThat(rendering.find(byRef.jobRef()).status()).isEqualTo(JobStatus.READY);
        assertThat(getJob.byRef(byRef.installationId(), byRef.jobRef()).status()).isEqualTo(JobStatus.RESULT_EXPIRED);
        assertThat(getJob.byIdempotency(byKey.installationId(), byKey.idempotencyKey()).status()).isEqualTo(JobStatus.RESULT_EXPIRED);
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_result_acknowledgements").query(Long.class).single()).isEqualTo(2);
    }

    @Test
    void expirationRollsBackWithDurableCleanupRequest() {
        var job = readyJob();
        assertThatThrownBy(() -> transaction.executeWithoutResult(ignored -> {
            assertThat(acknowledgementRepository.expire(job.installationId(), job.jobRef(), now.plusSeconds(3600), now)).isTrue();
            throw new IllegalStateException("synthetic rollback");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.READY);
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_result_acknowledgements").query(Long.class).single()).isZero();
    }

    @Test
    void concurrentExpirationBatchesClaimDifferentJobsAndLeaveUnfinishedJobsAlone() throws Exception {
        var first = readyJob();
        var second = readyJob();
        var unfinished = prepareRendering();
        Callable<Integer> expire = () -> transaction.execute(ignored -> acknowledgementRepository.expireBatch(1, now.plusSeconds(3600), now));
        try (var pool = Executors.newFixedThreadPool(2)) {
            var results = pool.invokeAll(List.of(expire, expire));
            assertThat(results.get(0).get() + results.get(1).get()).isEqualTo(2);
        }
        assertThat(rendering.find(first.jobRef()).status()).isEqualTo(JobStatus.RESULT_EXPIRED);
        assertThat(rendering.find(second.jobRef()).status()).isEqualTo(JobStatus.RESULT_EXPIRED);
        assertThat(rendering.find(unfinished.jobRef()).status()).isEqualTo(JobStatus.RENDERING);
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_result_acknowledgements").query(Long.class).single()).isEqualTo(2);
    }

    @Test
    void batchSkipsLockedReadyJobWithoutWaitingForItsOwner() throws Exception {
        var locked = readyJob();
        var available = readyJob();
        var held = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        try (var pool = Executors.newSingleThreadExecutor()) {
            var holder = pool.submit(() -> transaction.executeWithoutResult(ignored -> {
                jdbc.sql("SELECT id FROM processing_jobs WHERE id = :id FOR UPDATE")
                    .param("id", locked.id()).query(UUID.class).single();
                held.countDown();
                try { assertThat(release.await(10, TimeUnit.SECONDS)).isTrue(); }
                catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new AssertionError(error); }
            }));
            try {
                assertThat(held.await(10, TimeUnit.SECONDS)).isTrue();
                int expired = transaction.execute(ignored -> acknowledgementRepository.expireBatch(100, now.plusSeconds(3600), now));
                assertThat(expired).isEqualTo(1);
                assertThat(rendering.find(available.jobRef()).status()).isEqualTo(JobStatus.RESULT_EXPIRED);
                assertThat(rendering.find(locked.jobRef()).status()).isEqualTo(JobStatus.READY);
            } finally { release.countDown(); }
            holder.get(10, TimeUnit.SECONDS);
        }
        assertThat(expire(locked, now.plusSeconds(3600), now)).isTrue();
    }

    @Test
    void ackAndTtlRaceKeepOneDurableRequestAndExactCommitProof() throws Exception {
        var job = readyJob();
        var deadline = now.plusSeconds(3600);
        Callable<Boolean> ack = () -> {
            transaction.executeWithoutResult(ignored -> acknowledgementRepository.request(job.installationId(), job.jobRef(), deadline));
            return true;
        };
        Callable<Boolean> ttl = () -> { expire(job, deadline, now); return true; };
        try (var pool = Executors.newFixedThreadPool(2)) {
            for (var result : pool.invokeAll(List.of(ack, ttl))) assertThat(result.get()).isTrue();
        }
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.RESULT_EXPIRED);
        assertThat(rendering.find(job.jobRef()).artifacts()).isEqualTo(artifacts(job.id()));
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_result_acknowledgements WHERE job_id = :id")
            .param("id", job.id()).query(Long.class).single()).isOne();
    }

    private ProcessingJob readyJob() {
        var job = prepareRendering();
        rendering.claim(job.jobRef(), now);
        assertThat(rendering.complete(job.id(), artifacts(job.id()), now)).isTrue();
        return job;
    }

    @Test
    void expirationQueryUsesBoundedLockPlanAndDoesNotRequireNewSchema() {
        readyJob();
        var plan = transaction.execute(ignored -> jdbc.sql("EXPLAIN (ANALYZE, BUFFERS, TIMING OFF) "
                + JdbcResultAcknowledgementRepository.EXPIRATION_BATCH_CANDIDATES)
            .param("cutoff", timestamp(now)).param("now", timestamp(now)).param("limit", 100).query(String.class).list());
        assertThat(plan).anyMatch(line -> line.contains("Limit")).anyMatch(line -> line.contains("LockRows"));
        System.out.println("Result expiration EXPLAIN (synthetic local fixture):\n" + String.join("\n", plan));
        assertThat(jdbc.sql("SELECT version FROM flyway_schema_history WHERE success ORDER BY installed_rank")
            .query(String.class).list()).containsExactly("1", "2", "3", "4", "5", "6", "7", "8", "9");
    }

    @Test
    void invalidBatchOrFutureCutoffCannotChangeReadyJob() {
        var job = readyJob();
        for (int limit : new int[] {0, 101}) {
            assertThatThrownBy(() -> transaction.execute(ignored -> acknowledgementRepository.expireBatch(limit, now, now)))
                .isInstanceOf(InvalidDataAccessApiUsageException.class).hasMessage("Invalid expiration batch")
                .hasCauseInstanceOf(IllegalArgumentException.class);
        }
        assertThatThrownBy(() -> expire(job, now, now.plusSeconds(1)))
            .isInstanceOf(InvalidDataAccessApiUsageException.class).hasMessage("Invalid expiration cutoff")
            .hasCauseInstanceOf(IllegalArgumentException.class);
        assertThat(rendering.find(job.jobRef()).status()).isEqualTo(JobStatus.READY);
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_result_acknowledgements").query(Long.class).single()).isZero();
    }

    private boolean expire(ProcessingJob job, Instant at, Instant cutoff) {
        return transaction.execute(ignored -> acknowledgementRepository.expire(job.installationId(), job.jobRef(), at, cutoff));
    }

    private ProcessingJob prepareRendering() {
        var job = newJob();
        ocr.claim(job.jobRef(), now);
        assertThat(ocr.complete(job.id(), "private/ocr/" + job.id(), "a".repeat(64), now)).isTrue();
        translation.claim(job.jobRef(), now);
        assertThat(translation.complete(job.id(), "private/translation/" + job.id(), "b".repeat(64), now)).isTrue();
        return job;
    }

    private ProcessingJob newJob() {
        var installation = UUID.randomUUID();
        transaction.executeWithoutResult(ignored -> gateway.createInstallation(installation, "test-hash-" + installation, now));
        return reserve.execute(new GatewayRepository.NewJob(UUID.randomUUID(), UUID.randomUUID(), installation,
            UUID.randomUUID(), UUID.randomUUID(), "test-version", "ja", "pt-BR", "image/png", 1024, 100, 200,
            "private/original/" + UUID.randomUUID(), "0".repeat(64), "1".repeat(64), now, now.plus(7, ChronoUnit.DAYS))).job();
    }

    private static RenderingJobRepository.Artifacts artifacts(UUID id) {
        return new RenderingJobRepository.Artifacts("private/render/" + id + "/image.webp",
            new RenderedImage("image/webp", 1024, 100, 200, "c".repeat(64)),
            "private/render/" + id + "/manifest.json", "d".repeat(64));
    }

    private String stageStatus(UUID id) {
        return jdbc.sql("SELECT status FROM processing_job_stages WHERE job_id = :id AND stage = 'RENDERING'")
            .param("id", id).query(String.class).single();
    }

    private static OffsetDateTime timestamp(Instant value) { return OffsetDateTime.ofInstant(value, ZoneOffset.UTC); }
}
