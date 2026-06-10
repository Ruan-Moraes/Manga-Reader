package com.mangareader.presentation.forum.dto;

/**
 * DTO de resposta de um tópico do fórum.
 * <p>
 * A resposta é um comentário unificado ({@code targetType=FORUM_TOPIC});
 * {@code isBestAnswer} corresponde ao {@code isHighlighted} do comentário.
 * Votos por resposta usam os endpoints de comentário ({@code /api/comments}).
 */
public record ForumReplyResponse(
        String id,
        ForumAuthorResponse author,
        String content,
        String createdAt,
        String updatedAt,
        long upvotes,
        long downvotes,
        boolean edited,
        boolean isBestAnswer
) {}
