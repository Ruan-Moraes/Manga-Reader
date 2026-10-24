package com.toonlira.translationgateway.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;

import com.toonlira.translationgateway.application.CapabilitiesView;
import com.toonlira.translationgateway.application.DispatchPendingJobsUseCase;
import com.toonlira.translationgateway.application.GetCapabilitiesUseCase;
import com.toonlira.translationgateway.application.ReserveJobUseCase;
import com.toonlira.translationgateway.application.SubmitPageUseCase;
import com.toonlira.translationgateway.application.ProcessOcrTaskUseCase;
import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.domain.JobStatus;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.TransactionDefinition;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** Private synthetic upload and PostgreSQL only; no dispatcher/provider network or real media. */
@Tag("testcontainers")
@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class SubmissionCommitResolutionTest {
    @Container static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");
    @TempDir static Path temporary;
    @DynamicPropertySource static void configure(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("gateway.storage.local-directory", () -> temporary.resolve("objects").toString());
    }
    @Autowired SubmitPageUseCase submission;
    @Autowired GatewayRepository repository;
    @Autowired JdbcClient jdbc;
    @Autowired TransactionTemplate transaction;
    @Autowired ProcessOcrTaskUseCase processOcr;
    @MockitoBean GetCapabilitiesUseCase capabilities;
    @MockitoBean DispatchPendingJobsUseCase dispatcher;
    @MockitoBean OcrPort ocr;
    @MockitoSpyBean ReserveJobUseCase reserve;
    @MockitoSpyBean ObjectStoragePort storage;

    @BeforeEach void resetState() {
        jdbc.sql("DELETE FROM anonymous_installations").update();
        reset(reserve, storage, capabilities, dispatcher, ocr);
        when(ocr.available()).thenReturn(true);
        when(ocr.recognize(any())).thenReturn(List.of());
        var now = Instant.now();
        var disclosure = new CapabilitiesView.LegalDisclosure("synthetic-v1", "Synthetic operator", "test@example.com",
            "https://example.com/privacy", "https://example.com/terms", "southamerica-east1", "us", "global",
            3600, 3600, 7, "Synthetic configuration");
        when(capabilities.execute()).thenReturn(new CapabilitiesView("1.0", "synthetic-test", now, now.plusSeconds(300), true,
            GetCapabilitiesUseCase.LANGUAGES, List.of(new CapabilitiesView.LanguagePair("ja", "pt-BR")),
            new CapabilitiesView.MediaLimits(GetCapabilitiesUseCase.MIME_TYPES, 12L * 1024 * 1024, 12000, 12000, 80000000),
            20, 100, disclosure, "\"synthetic\""));
    }

    @ParameterizedTest
    @ValueSource(strings = {"confirmed", "pending-commit", "pending-rollback"})
    void reservationOutcomeMustResolveBeforeRemovingItsOriginal(String scenario) throws Exception {
        var installation = UUID.randomUUID();
        var key = UUID.randomUUID();
        var now = Instant.now().truncatedTo(ChronoUnit.MILLIS);
        transaction.executeWithoutResult(ignored -> repository.createInstallation(installation, "synthetic-hash", now));
        var reusable = temporary.resolve("sample-" + UUID.randomUUID() + ".png");
        ImageIO.write(new BufferedImage(8, 8, BufferedImage.TYPE_INT_RGB), "png", reusable.toFile());
        var bytes = Files.readAllBytes(reusable);
        var originalHash = hash(bytes);
        var command = new SubmitPageUseCase.Command("image/png", bytes.length, 8, 8, "ja", "pt-BR", "synthetic-v1", UUID.randomUUID());
        var entered = new CountDownLatch(1);
        var release = new CountDownLatch(scenario.equals("confirmed") ? 0 : 1);
        var pending = new AtomicReference<Future<?>>();
        var candidate = new AtomicReference<GatewayRepository.NewJob>();
        var accepted = new AtomicReference<ReserveJobUseCase.Result>();
        var prematureDeletes = new AtomicInteger();
        var failure = new IllegalStateException("synthetic reservation confirmation unavailable");
        doAnswer(call -> {
            assertThat(TransactionSynchronizationManager.isActualTransactionActive()).isFalse();
            if (release.getCount() != 0) prematureDeletes.incrementAndGet();
            return call.callRealMethod();
        }).when(storage).delete(any());

        try (var pool = Executors.newFixedThreadPool(2)) {
            doAnswer(call -> {
                candidate.set(call.getArgument(0));
                pending.set(pool.submit(() -> transaction.executeWithoutResult(status -> {
                    try { accepted.set((ReserveJobUseCase.Result) call.callRealMethod()); }
                    catch (Throwable error) { throw new AssertionError("synthetic reservation failed", error); }
                    entered.countDown();
                    try { assertThat(release.await(10, TimeUnit.SECONDS)).isTrue(); }
                    catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new AssertionError("fixture interrupted"); }
                    if (scenario.equals("pending-rollback")) status.setRollbackOnly();
                })));
                assertThat(entered.await(10, TimeUnit.SECONDS)).isTrue();
                if (scenario.equals("confirmed")) pending.get().get(10, TimeUnit.SECONDS);
                throw failure;
            }).when(reserve).execute(any());
            var request = pool.submit(() -> assertThatThrownBy(() -> submission.execute(installation, key, command,
                new ByteArrayInputStream(bytes))).isSameAs(failure));
            try {
                assertThat(entered.await(10, TimeUnit.SECONDS)).isTrue();
                if (!scenario.equals("confirmed")) {
                    awaitResolutionOrPrematureDeletion(prematureDeletes);
                    assertThat(prematureDeletes.get()).as("unresolved reservation must not delete its upload").isZero();
                    assertThat(request.isDone()).isFalse();
                }
            } finally {
                release.countDown();
                request.get(20, TimeUnit.SECONDS);
                if (pending.get() != null) pending.get().get(20, TimeUnit.SECONDS);
            }
        }
        boolean committed = !scenario.equals("pending-rollback");
        var owned = temporary.resolve("objects").resolve(candidate.get().objectKey());
        assertThat(Files.exists(owned)).isEqualTo(committed);
        if (committed) assertThat(hash(Files.readAllBytes(owned))).isEqualTo(originalHash);
        assertThat(jdbc.sql("SELECT count(*) FROM processing_jobs").query(Integer.class).single()).isEqualTo(committed ? 1 : 0);
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_dispatches").query(Integer.class).single()).isEqualTo(committed ? 1 : 0);

        reset(reserve);
        var replay = submission.execute(installation, key, command, new ByteArrayInputStream(bytes));
        assertThat(replay.created()).isEqualTo(!committed);
        if (committed) assertThat(replay.job().jobRef()).isEqualTo(accepted.get().job().jobRef());
        var day = LocalDate.ofInstant(replay.job().serverTime(), ZoneOffset.UTC);
        long jobs = transaction.execute(ignored -> repository.countInstallationJobs(installation,
            day.atStartOfDay().toInstant(ZoneOffset.UTC), day.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC)));
        assertThat(jobs).isEqualTo(1);
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_dispatches").query(Integer.class).single()).isEqualTo(1);
        assertThat(hash(Files.readAllBytes(reusable))).isEqualTo(originalHash);
        processOcr.execute(replay.job().jobRef());
        processOcr.execute(replay.job().jobRef());
        var processed = transaction.execute(ignored -> repository.findByIdempotency(installation, key).orElseThrow());
        assertThat(processed.status()).isEqualTo(JobStatus.TRANSLATING);
        verify(ocr, times(1)).recognize(any());
    }

    private void awaitResolutionOrPrematureDeletion(AtomicInteger prematureDeletes) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
        while (System.nanoTime() < deadline) {
            if (prematureDeletes.get() != 0 || jdbc.sql("SELECT count(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND query LIKE '%anonymous_installations%'")
                .query(Integer.class).single() > 0) return;
            Thread.sleep(10);
        }
        throw new AssertionError("submission did not reach its PostgreSQL resolution lock");
    }

    @Test
    void originalOwnershipIsExactAndUsesExistingIndexWithoutConsumingQuota() {
        var now = Instant.now();
        var owner = UUID.randomUUID();
        var other = UUID.randomUUID();
        transaction.executeWithoutResult(ignored -> {
            repository.createInstallation(owner, "synthetic-owner", now);
            repository.createInstallation(other, "synthetic-other", now);
        });
        var candidate = new GatewayRepository.NewJob(UUID.randomUUID(), UUID.randomUUID(), owner, UUID.randomUUID(), UUID.randomUUID(),
            "synthetic-v1", "ja", "pt-BR", "image/png", 32, 1, 1, "private/originals/synthetic", "a".repeat(64), "b".repeat(64),
            now, now.plus(7, ChronoUnit.DAYS));
        reserve.execute(candidate);
        assertThat(reserve.ownsOriginal(candidate)).isTrue();
        for (var field : List.of("id", "installation", "idempotency", "object", "hash", "fingerprint")) {
            var mismatch = new GatewayRepository.NewJob(field.equals("id") ? UUID.randomUUID() : candidate.id(), candidate.jobRef(),
                field.equals("installation") ? other : owner, field.equals("idempotency") ? UUID.randomUUID() : candidate.idempotencyKey(),
                candidate.attemptRef(), candidate.disclosureVersion(), candidate.sourceLanguage(), candidate.targetLanguage(), candidate.mimeType(),
                candidate.byteSize(), candidate.widthPx(), candidate.heightPx(), field.equals("object") ? "private/originals/other" : candidate.objectKey(),
                field.equals("hash") ? "c".repeat(64) : candidate.originalSha256(), field.equals("fingerprint") ? "d".repeat(64) : candidate.requestFingerprint(),
                candidate.now(), candidate.metadataExpiresAt());
            assertThat(reserve.ownsOriginal(mismatch)).as("mismatch in %s", field).isFalse();
        }
        var plan = transaction.execute(ignored -> {
            jdbc.sql("SET LOCAL enable_seqscan = off").update();
            return String.join("\n", jdbc.sql("EXPLAIN (ANALYZE, BUFFERS) " + JdbcGatewayRepository.ORIGINAL_OWNERSHIP_SQL)
                .param("id", candidate.id()).param("installationId", owner).param("idempotencyKey", candidate.idempotencyKey())
                .param("objectKey", candidate.objectKey()).param("originalSha256", candidate.originalSha256())
                .param("fingerprint", candidate.requestFingerprint()).query(String.class).list());
        });
        // No raw plan is logged: predicates can contain object identifiers.
        assertThat(plan.contains("Index") && plan.contains("processing_jobs")).isTrue();
        assertThat(jdbc.sql("SELECT count(*) FROM processing_jobs").query(Integer.class).single()).isEqualTo(1);
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_dispatches").query(Integer.class).single()).isEqualTo(1);
    }
    private static String hash(byte[] bytes) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }

    @Test
    void ownershipUsesFreshIndependentSnapshotInsideRepeatableReadCaller() throws Exception {
        var now = Instant.now();
        var owner = UUID.randomUUID();
        transaction.executeWithoutResult(ignored -> repository.createInstallation(owner, "synthetic-owner", now));
        var candidate = new GatewayRepository.NewJob(UUID.randomUUID(), UUID.randomUUID(), owner, UUID.randomUUID(), UUID.randomUUID(),
            "synthetic-v1", "ja", "pt-BR", "image/png", 32, 1, 1, "private/originals/synthetic", "a".repeat(64), "b".repeat(64),
            now, now.plus(7, ChronoUnit.DAYS));
        var outer = new TransactionTemplate(transaction.getTransactionManager());
        outer.setIsolationLevel(TransactionDefinition.ISOLATION_REPEATABLE_READ);
        try (var pool = Executors.newSingleThreadExecutor()) {
            outer.executeWithoutResult(status -> {
                assertThat(repository.findByIdempotency(owner, candidate.idempotencyKey())).isEmpty();
                var accepted = pool.submit(() -> reserve.execute(candidate));
                try { assertThat(accepted.get(10, TimeUnit.SECONDS).created()).isTrue(); }
                catch (Exception error) { throw new AssertionError("synthetic reservation did not complete", error); }
                assertThat(repository.findByIdempotency(owner, candidate.idempotencyKey())).isEmpty();
                assertThat(reserve.ownsOriginal(candidate)).isTrue();
            });
        }
        assertThat(jdbc.sql("SELECT count(*) FROM processing_jobs").query(Integer.class).single()).isEqualTo(1);
        assertThat(jdbc.sql("SELECT count(*) FROM processing_job_dispatches").query(Integer.class).single()).isEqualTo(1);
    }
}
