package com.mangareader.translationgateway.infrastructure.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.mangareader.translationgateway.application.DispatchPersistenceUseCase;
import com.mangareader.translationgateway.application.ReserveJobUseCase;
import com.mangareader.translationgateway.application.port.GatewayRepository;
import com.mangareader.translationgateway.domain.GatewayException;
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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DuplicateKeyException;
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
