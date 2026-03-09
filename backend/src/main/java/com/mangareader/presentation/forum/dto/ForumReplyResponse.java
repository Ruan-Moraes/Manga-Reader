package com.mangareader.presentation.forum.dto;

/**
 * DTO de resposta de um tópico do fórum.
 * <p>
 * Compatível com {@code ForumReply} em forum.types.ts.
 */
public record ForumReplyResponse(
        String id,
        ForumAuthorResponse author,
        String content,
        String createdAt,
        int likes,
        boolean isEdited,
        boolean isBestAnswer
) {}
