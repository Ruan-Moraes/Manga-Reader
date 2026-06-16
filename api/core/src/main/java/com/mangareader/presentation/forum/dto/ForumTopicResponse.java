package com.mangareader.presentation.forum.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO completo de tópico do fórum retornado ao frontend.
 * <p>
 * Votos seguem o contrato único ({@code upvotes}/{@code downvotes}/
 * {@code myVote}). Replies são comentários unificados mapeados para
 * {@link ForumReplyResponse}.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ForumTopicResponse(
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
        boolean edited,
        List<ForumReplyResponse> replies
) {}
