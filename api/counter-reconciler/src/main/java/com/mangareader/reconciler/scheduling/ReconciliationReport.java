package com.mangareader.reconciler.scheduling;

import java.util.Map;

/**
 * Resultado de uma execução de reconciliação — contadores afetados por fonte.
 *
 * @param groups       linhas de {@code groups} corrigidas (total_titles)
 * @param events       linhas de {@code events} corrigidas (participants)
 * @param forumReplies documentos de {@code forum_topics} corrigidos (replyCount)
 * @param votes        documentos modificados por pai votável (upvotes/downvotes)
 */
public record ReconciliationReport(int groups, int events, long forumReplies, Map<String, Long> votes) {}
