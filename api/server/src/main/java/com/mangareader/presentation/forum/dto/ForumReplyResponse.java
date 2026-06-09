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
        String updatedAt,
        int likes,
        boolean edited,
        boolean isBestAnswer
) {}
