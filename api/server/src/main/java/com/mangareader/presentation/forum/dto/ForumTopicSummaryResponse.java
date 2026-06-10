package com.mangareader.presentation.forum.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO de tópico do fórum para LISTAGEM — sem o array de replies.
 * <p>
 * Listagens expõem apenas {@code replyCount} (escalar desnormalizado em
 * {@code ForumTopic}). As respostas completas vêm só no detalhe
 * ({@link ForumTopicResponse}).
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
        String updatedAt,
        String lastActivityAt,
        int viewCount,
        long replyCount,
        long upvotes,
        long downvotes,
        String myVote,
        boolean isPinned,
        boolean isLocked,
        boolean isSolved,
        boolean edited
) {}
