package com.mangareader.reconciler.infrastructure.postgres;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Reconcilia os contadores desnormalizados do Postgres a partir de sua fonte.
 * <p>
 * Cada update é um bulk correlato idempotente ({@code SET = COUNT}): corrige o
 * drift dos incrementos mantidos pelos use cases da API sem risco de
 * double-count. Roda em SQL nativo (sem entidades JPA) — o serviço não precisa
 * do grafo de domínio, só dos contadores.
 */
@Component
@RequiredArgsConstructor
public class PostgresCounterReconciler {
    private static final String RECONCILE_TOTAL_TITLES = """
            UPDATE groups g
               SET total_titles = (SELECT COUNT(*) FROM group_works w WHERE w.group_id = g.id)""";

    private static final String RECONCILE_PARTICIPANTS = """
            UPDATE events e
               SET participants = (SELECT COUNT(*) FROM event_participants p WHERE p.event_id = e.id)""";

    private final JdbcTemplate jdbcTemplate;

    /** {@code groups.total_titles = COUNT(obras do grupo)}. Retorna linhas afetadas. */
    public int reconcileTotalTitles() {
        return jdbcTemplate.update(RECONCILE_TOTAL_TITLES);
    }

    /** {@code events.participants = COUNT(inscritos do evento)}. Retorna linhas afetadas. */
    public int reconcileParticipants() {
        return jdbcTemplate.update(RECONCILE_PARTICIPANTS);
    }
}
