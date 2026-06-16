package com.mangareader.reconciler.scheduling;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.mangareader.reconciler.infrastructure.mongo.ForumReplyCountReconciler;
import com.mangareader.reconciler.infrastructure.mongo.VoteCounterReconciler;
import com.mangareader.reconciler.infrastructure.postgres.PostgresCounterReconciler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Orquestra a reconciliação dos contadores desnormalizados (rede de segurança
 * contra drift). Cada fonte é reconciliada por um colaborador dedicado;
 * este job apenas coordena e reporta.
 * <p>
 * A lógica fica em {@link #reconcile()} (testável sem o agendador); o cron
 * apenas a dispara.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CounterReconciliationJob {
    private final PostgresCounterReconciler postgresReconciler;
    private final ForumReplyCountReconciler forumReplyReconciler;
    private final VoteCounterReconciler voteReconciler;

    /** De hora em hora (no minuto 0), por padrão. */
    @Scheduled(cron = "${reconciler.reconciliation.cron:0 0 * * * *}")
    public void scheduledReconcile() {
        ReconciliationReport report = reconcile();

        log.info("Reconciliação de contadores: groups={}, events={}, forum_topics(replyCount)={}, votos={}",
                report.groups(), report.events(), report.forumReplies(), report.votes());
    }

    /**
     * Reconcilia todas as fontes e devolve o resumo do que foi corrigido.
     * Idempotente — seguro para rodar a qualquer momento.
     */
    public ReconciliationReport reconcile() {
        int groups = postgresReconciler.reconcileTotalTitles();
        int events = postgresReconciler.reconcileParticipants();
        long forumReplies = forumReplyReconciler.reconcile();

        return new ReconciliationReport(groups, events, forumReplies, voteReconciler.reconcileAll());
    }
}
