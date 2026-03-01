package com.mangareader.presentation.forum.dto;

/**
 * DTO do autor de um tópico/reply no fórum.
 * <p>
 * Compatível com {@code ForumAuthor} em forum.types.ts.
 */
public record ForumAuthorResponse(
        String id,
        String name,
        String avatar,
        String role,
        int postCount,
        String joinedAt
) {}
