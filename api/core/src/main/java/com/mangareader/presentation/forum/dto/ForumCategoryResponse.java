package com.mangareader.presentation.forum.dto;

/**
 * Response com nome e displayName de uma categoria do fórum.
 */
public record ForumCategoryResponse(
        String name,
        String displayName
) {}
