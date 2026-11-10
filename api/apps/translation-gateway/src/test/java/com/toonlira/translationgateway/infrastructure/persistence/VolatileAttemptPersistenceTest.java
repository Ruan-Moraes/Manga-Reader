package com.toonlira.translationgateway.infrastructure.persistence;

import static org.assertj.core.api.Assertions.*;

import com.toonlira.translationgateway.application.VolatileAttemptUseCase;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.VolatileAttemptRepository;
import com.toonlira.translationgateway.domain.GatewayException;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Tag("testcontainers")
@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class VolatileAttemptPersistenceTest {
    @Container static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }
    @Autowired JdbcClient jdbc;
    @Autowired TransactionTemplate transactions;
    @Autowired VolatileAttemptUseCase attempts;
    @Autowired VolatileAttemptRepository repository;
    @Autowired GatewayProperties properties;
    private UUID owner;
    private static UUID key() {
        return new UUID((Instant.now().toEpochMilli() << 16) | 0x7000L | (UUID.randomUUID().getMostSignificantBits() & 0xfff),
            UUID.randomUUID().getLeastSignificantBits());
    }
    private static UUID keyAt(Instant timestamp) {
        return new UUID((timestamp.toEpochMilli() << 16) | 0x7000L, UUID.randomUUID().getLeastSignificantBits());
    }
    @BeforeEach void prepare() {
        properties.getTestBudget().setEnabled(false);
        jdbc.sql("DELETE FROM volatile_test_budget_window").update();
        jdbc.sql("DELETE FROM anonymous_installations").update();
        owner = UUID.randomUUID();
        jdbc.sql("INSERT INTO anonymous_installations(id,credential_hash,status,created_at,last_seen_at) VALUES (:id,:hash,'ACTIVE',now(),now())")
            .param("id", owner).param("hash", "test:" + owner).update();
    }

    @Test void appliesWholeMigrationChainAndKeepsReceiptWithoutContentColumns() {
        var key = key(); var receipt = attempts.reserve(owner, key);
        assertThat(attempts.find(owner, key)).contains(receipt);
        assertThat(attempts.find(UUID.randomUUID(), key)).isEmpty();
        assertThatThrownBy(() -> attempts.reserve(owner, key)).isInstanceOf(GatewayException.class);
        attempts.finish(receipt.operationRef(), VolatileAttemptRepository.Status.FINISHED, null);
        assertThat(attempts.find(owner, key).orElseThrow().status()).isEqualTo(VolatileAttemptRepository.Status.FINISHED);
        assertThat(jdbc.sql("SELECT column_name FROM information_schema.columns WHERE table_name='volatile_processing_attempts'")
            .query(String.class).list()).containsExactlyInAnyOrder("operation_ref", "installation_id", "idempotency_key", "status", "created_at", "finished_at", "error_code");
        assertThat(jdbc.sql("SELECT max(version::int) FROM flyway_schema_history WHERE success=true").query(Integer.class).single()).isEqualTo(11);
    }

    @Test void testBudgetAndReceiptCommitTogetherAndNeverRefundFailedCalls() {
        properties.getTestBudget().setEnabled(true);
        properties.getTestBudget().setMaxAttempts(1);
        properties.getTestBudget().setDeadline(Instant.now().plusSeconds(3600));
        var receipt = attempts.reserve(owner, key());
        attempts.finish(receipt.operationRef(), VolatileAttemptRepository.Status.FAILED, "internal-error");
        assertThatThrownBy(() -> attempts.reserve(owner, key()))
            .isInstanceOfSatisfying(GatewayException.class, error -> assertThat(error.status()).isEqualTo(429));
        assertThat(jdbc.sql("SELECT attempts_reserved FROM volatile_test_budget_window WHERE window_key='private-test'")
            .query(Long.class).single()).isEqualTo(1);
        assertThat(jdbc.sql("SELECT count(*) FROM volatile_processing_attempts").query(Long.class).single()).isEqualTo(1);
    }

    @Test void testBudgetConcurrentReservationsCannotExceedLimit() throws Exception {
        properties.getTestBudget().setEnabled(true);
        properties.getTestBudget().setMaxAttempts(1);
        properties.getTestBudget().setDeadline(Instant.now().plusSeconds(3600));
        var start = new CountDownLatch(1);
        try (var pool = Executors.newVirtualThreadPerTaskExecutor()) {
            var task = (java.util.concurrent.Callable<Boolean>) () -> {
                start.await();
                try { attempts.reserve(owner, key()); return true; }
                catch (GatewayException error) { assertThat(error.status()).isEqualTo(429); return false; }
            };
            var first = pool.submit(task); var second = pool.submit(task); start.countDown();
            assertThat(java.util.List.of(first.get(5, TimeUnit.SECONDS), second.get(5, TimeUnit.SECONDS)))
                .containsExactlyInAnyOrder(true, false);
        }
        assertThat(jdbc.sql("SELECT attempts_reserved FROM volatile_test_budget_window").query(Long.class).single()).isEqualTo(1);
    }

    @Test void testBudgetRejectsInvalidConfigurationOrExpiredWindow() {
        properties.getTestBudget().setEnabled(true);
        properties.getTestBudget().setMaxAttempts(0);
        properties.getTestBudget().setDeadline(Instant.now().plusSeconds(3600));
        assertThatThrownBy(() -> attempts.reserve(owner, key())).isInstanceOf(GatewayException.class);
        properties.getTestBudget().setMaxAttempts(1);
        properties.getTestBudget().setDeadline(Instant.now().minusSeconds(1));
        assertThatThrownBy(() -> attempts.reserve(owner, key())).isInstanceOf(GatewayException.class);
        assertThat(jdbc.sql("SELECT count(*) FROM volatile_test_budget_window").query(Long.class).single()).isZero();
        assertThat(jdbc.sql("SELECT count(*) FROM volatile_processing_attempts").query(Long.class).single()).isZero();
    }

    @Test void testBudgetRollsBackWithReceiptAndReplayDoesNotSpendAnotherSlot() {
        properties.getTestBudget().setEnabled(true);
        properties.getTestBudget().setMaxAttempts(2);
        properties.getTestBudget().setDeadline(Instant.now().plusSeconds(3600));
        var firstKey = key();
        assertThatThrownBy(() -> transactions.executeWithoutResult(status -> {
            attempts.reserve(owner, firstKey);
            throw new IllegalStateException("rollback");
        })).isInstanceOf(IllegalStateException.class);
        assertThat(jdbc.sql("SELECT count(*) FROM volatile_test_budget_window").query(Long.class).single()).isZero();
        assertThat(jdbc.sql("SELECT count(*) FROM volatile_processing_attempts").query(Long.class).single()).isZero();

        attempts.reserve(owner, firstKey);
        assertThatThrownBy(() -> attempts.reserve(owner, firstKey))
            .isInstanceOfSatisfying(GatewayException.class, error -> assertThat(error.status()).isEqualTo(409));
        assertThat(jdbc.sql("SELECT attempts_reserved FROM volatile_test_budget_window").query(Long.class).single()).isEqualTo(1);
    }

    @Test void testBudgetOutlivesDeletedIndividualReceipts() {
        properties.getTestBudget().setEnabled(true);
        properties.getTestBudget().setMaxAttempts(1);
        properties.getTestBudget().setDeadline(Instant.now().plusSeconds(3600));
        attempts.reserve(owner, key());
        jdbc.sql("DELETE FROM anonymous_installations WHERE id=:id").param("id", owner).update();
        assertThat(jdbc.sql("SELECT count(*) FROM volatile_processing_attempts").query(Long.class).single()).isZero();
        owner = UUID.randomUUID();
        jdbc.sql("INSERT INTO anonymous_installations(id,credential_hash,status,created_at,last_seen_at) VALUES (:id,:hash,'ACTIVE',now(),now())")
            .param("id", owner).param("hash", "test:" + owner).update();
        assertThatThrownBy(() -> attempts.reserve(owner, key()))
            .isInstanceOfSatisfying(GatewayException.class, error -> assertThat(error.status()).isEqualTo(429));
        assertThat(jdbc.sql("SELECT attempts_reserved FROM volatile_test_budget_window").query(Long.class).single()).isEqualTo(1);
    }

    @Test void concurrentReplayCommitsOnlyOneReceipt() throws Exception {
        var start = new CountDownLatch(1); var key = key();
        try (var pool = Executors.newVirtualThreadPerTaskExecutor()) {
            var work = (java.util.concurrent.Callable<Boolean>) () -> {
                start.await();
                try { attempts.reserve(owner, key); return true; }
                catch (GatewayException conflict) { assertThat(conflict.status()).isEqualTo(409); return false; }
            };
            var first = pool.submit(work); var second = pool.submit(work); start.countDown();
            assertThat(java.util.List.of(first.get(5, TimeUnit.SECONDS), second.get(5, TimeUnit.SECONDS))).containsExactlyInAnyOrder(true, false);
        }
        assertThat(jdbc.sql("SELECT count(*) FROM volatile_processing_attempts").query(Long.class).single()).isEqualTo(1);
    }

    @Test void globalQuotaIsSerializedAndFailedReceiptStillConsumesReservation() {
        var now = Instant.now(); var first = UUID.randomUUID();
        transactions.executeWithoutResult(status -> repository.reserve(owner, key(), first, now, 20, 1));
        transactions.executeWithoutResult(status -> repository.finish(first, VolatileAttemptRepository.Status.FAILED, "internal-error", now));
        assertThatThrownBy(() -> transactions.executeWithoutResult(status -> repository.reserve(owner, key(), UUID.randomUUID(), now, 20, 1)))
            .isInstanceOfSatisfying(GatewayException.class, error -> assertThat(error.status()).isEqualTo(429));
    }

    @Test void constraintsRejectUnknownStatusRawErrorsAndTerminalWithoutTimestamp() {
        var receipt = attempts.reserve(owner, key());
        for (var sql : new String[]{"status='READY'", "status='FINISHED'", "error_code='sensitive-content'"}) {
            assertThatThrownBy(() -> jdbc.sql("UPDATE volatile_processing_attempts SET " + sql + " WHERE operation_ref=:ref")
                .param("ref", receipt.operationRef()).update()).isInstanceOf(DataIntegrityViolationException.class);
        }
    }

    @Test void purgeNeverResurrectsAKeyIncludingAcceptedFutureClockSkew() {
        var created = Instant.parse("2026-11-01T12:00:00Z");
        var timestamp = created.plusSeconds(240);
        var key = keyAt(timestamp);
        var properties = new GatewayProperties();
        var initial = new VolatileAttemptUseCase(repository, properties, Clock.fixed(created, ZoneOffset.UTC));
        transactions.executeWithoutResult(status -> initial.reserve(owner, key));
        var oldReceiptButActiveKey = new VolatileAttemptUseCase(repository, properties,
            Clock.fixed(created.plusSeconds(7 * 86400), ZoneOffset.UTC));
        assertThat(oldReceiptButActiveKey.find(owner, key)).isPresent();
        assertThat(transactions.<Integer>execute(status -> oldReceiptButActiveKey.purgeExpired())).isZero();
        assertThatThrownBy(() -> transactions.execute(status -> oldReceiptButActiveKey.reserve(owner, key)))
            .isInstanceOfSatisfying(GatewayException.class, error -> assertThat(error.status()).isEqualTo(409));

        var expired = new VolatileAttemptUseCase(repository, properties,
            Clock.fixed(timestamp.plusSeconds(7 * 86400), ZoneOffset.UTC));
        assertThat(repository.find(owner, key)).isPresent();
        assertThat(expired.find(owner, key)).isEmpty();
        assertThatThrownBy(() -> transactions.execute(status -> expired.reserve(owner, key))).isInstanceOf(GatewayException.class);
        assertThat(transactions.<Integer>execute(status -> expired.purgeExpired())).isOne();
        assertThat(repository.find(owner, key)).isEmpty();
        assertThatThrownBy(() -> transactions.execute(status -> expired.reserve(owner, key)))
            .isInstanceOfSatisfying(GatewayException.class, error -> assertThat(error.status()).isEqualTo(409));
        assertThat(jdbc.sql("SELECT count(*) FROM volatile_processing_attempts").query(Long.class).single()).isZero();
    }
}
