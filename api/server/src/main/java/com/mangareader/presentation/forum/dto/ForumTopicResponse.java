package com.mangareader.presentation.forum.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO completo de tópico do fórum retornado ao frontend.
 * <p>
 * Compatível com {@code ForumTopic} em forum.types.ts.
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
        String lastActivityAt,
        int viewCount,
        int replyCount,
        int likeCount,
        boolean isPinned,
        boolean isLocked,
        boolean isSolved,
        List<ForumReplyResponse> replies
) {}
