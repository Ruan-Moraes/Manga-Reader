package com.mangareader.reconciler.scheduling;

import java.util.Map;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.mangareader.reconciler.infrastructure.crossdb.OrphanTitleRefReconciler;
import com.mangareader.reconciler.infrastructure.mongo.ForumReplyCountReconciler;
import com.mangareader.reconciler.infrastructure.mongo.VoteCounterReconciler;
import com.mangareader.reconciler.infrastructure.postgres.PostgresCounterReconciler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Orquestra duas redes de segurança contra drift entre Postgres e Mongo: a
 * reconciliação dos contadores desnormalizados (de hora em hora) e a limpeza de
 * referências órfãs cross-DB (diária). Cada fonte tem um colaborador dedicado;
 * este job apenas coordena e reporta.
 * <p>
 * A lógica fica em {@link #reconcile()} / {@link #reconcileOrphans()} (testáveis
 * sem o agendador); os crons apenas as disparam.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CounterReconciliationJob {
    private final PostgresCounterReconciler postgresReconciler;
    private final ForumReplyCountReconciler forumReplyReconciler;
    private final VoteCounterReconciler voteReconciler;
    private final OrphanTitleRefReconciler orphanReconciler;

    /** Contadores: de hora em hora (no minuto 0), por padrão. */
    @Scheduled(cron = "${reconciler.reconciliation.cron:0 0 * * * *}")
    public void scheduledReconcile() {
        ReconciliationReport report = reconcile();

        log.info("Reconciliação de contadores: groups={}, events={}, forum_topics(replyCount)={}, votos={}",
                report.groups(), report.events(), report.forumReplies(), report.votes());
    }

    /** Órfãos cross-DB: diária (03:30), por padrão. Mais pesado e sem urgência. */
    @Scheduled(cron = "${reconciler.orphan.cron:0 30 3 * * *}")
    public void scheduledOrphanCleanup() {
        Map<String, Integer> removed = reconcileOrphans();

        log.info("Limpeza de órfãos cross-DB: {}", removed);
    }

    /**
     * Reconcilia os contadores de todas as fontes e devolve o resumo do que foi
     * corrigido. Idempotente — seguro para rodar a qualquer momento.
     */
    public ReconciliationReport reconcile() {
        int groups = postgresReconciler.reconcileTotalTitles();
        int events = postgresReconciler.reconcileParticipants();
        long forumReplies = forumReplyReconciler.reconcile();

        return new ReconciliationReport(groups, events, forumReplies, voteReconciler.reconcileAll());
    }

    /**
     * Remove as referências órfãs cross-DB e, se apagou obras de grupo, reconcilia
     * {@code groups.total_titles} para refletir a limpeza na mesma passada.
     * Idempotente.
     *
     * @return mapa {@code tabela -> linhas removidas}.
     */
    public Map<String, Integer> reconcileOrphans() {
        Map<String, Integer> removed = orphanReconciler.reconcile();

        if (removed.getOrDefault("group_works", 0) > 0) {
            postgresReconciler.reconcileTotalTitles();
        }

        return removed;
    }
}
