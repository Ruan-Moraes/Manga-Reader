package com.mangareader.presentation.forum.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO de tópico do fórum para LISTAGEM — sem o array de replies.
 * <p>
 * Listagens expõem apenas {@code replyCount} (escalar desnormalizado em
 * {@code ForumTopic}). O array completo de replies vem só no detalhe
 * ({@link ForumTopicResponse}), evitando N+1 aninhado na listagem.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ForumTopicSummaryResponse(
        String id,
        String title,
        String content,
        ForumAuthorResponse author,
        String category,
        List<String> tags,
        String createdAt,
        String lastActivityAt,
        int viewCount,
        int replyCount,
        int likeCount,
        boolean isPinned,
        boolean isLocked,
        boolean isSolved
) {}
