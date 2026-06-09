package com.mangareader.infrastructure.scheduling;

import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.infrastructure.persistence.postgres.repository.EventJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.ForumTopicJpaRepository;
import com.mangareader.infrastructure.persistence.postgres.repository.GroupJpaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * PERF-6: rede de segurança contra drift dos contadores desnormalizados.
 * <p>
 * Os use cases mantêm {@code replyCount}/{@code totalTitles} por incremento e
 * {@code participants} não é mantido no join/leave. Este job recalcula periodicamente
 * cada contador a partir de sua tabela-fonte (bulk update idempotente {@code SET = COUNT}),
 * corrigindo divergências sem risco de double-count.
 */
@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class CounterReconciliationJob {
    private final ForumTopicJpaRepository forumTopics;
    private final GroupJpaRepository groups;
    private final EventJpaRepository events;

    /** De hora em hora (no minuto 0). */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void reconcile() {
        int topics = forumTopics.reconcileReplyCounts();
        int grps = groups.reconcileTotalTitles();
        int evts = events.reconcileParticipants();

        log.info("Reconciliação de contadores: forum_topics={}, groups={}, events={}", topics, grps, evts);
    }
}
