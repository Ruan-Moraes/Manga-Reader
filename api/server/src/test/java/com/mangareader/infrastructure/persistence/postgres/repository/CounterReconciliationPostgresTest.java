package com.mangareader.infrastructure.persistence.postgres.repository;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupWork;
import com.mangareader.infrastructure.persistence.postgres.PostgresTestContainerConfig;

/**
 * PERF-6: valida a reconciliação idempotente de contador desnormalizado contra Postgres real
 * (correlated bulk update {@code SET = COUNT}). Cobre o padrão usado também por
 * {@code reconcileReplyCounts} e {@code reconcileParticipants} (mesma estrutura HQL).
 */
@DataJpaTest
@ActiveProfiles("test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(PostgresTestContainerConfig.class)
@TestPropertySource(properties = {
        "spring.flyway.enabled=true",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect"
})
@DisplayName("CounterReconciliation — Postgres")
@Tag("testcontainers")
class CounterReconciliationPostgresTest {

    @Autowired
    private GroupJpaRepository groups;

    @Autowired
    private TestEntityManager em;

    @Test
    @DisplayName("reconcileTotalTitles corrige drift do contador para a contagem real de obras")
    void reconcileTotalTitlesCorrigeDrift() {
        Group group = Group.builder().username("scan-x").totalTitles(99).build();
        em.persist(group);
        em.persist(GroupWork.builder().group(group).titleId("t1").title("Obra A").build());
        em.persist(GroupWork.builder().group(group).titleId("t2").title("Obra B").build());
        em.flush();

        int updated = groups.reconcileTotalTitles();
        em.clear();

        assertThat(updated).isPositive();
        Group reloaded = groups.findById(group.getId()).orElseThrow();
        assertThat(reloaded.getTotalTitles()).isEqualTo(2);
    }
}
