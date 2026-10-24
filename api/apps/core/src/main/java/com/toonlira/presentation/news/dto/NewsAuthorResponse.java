package com.toonlira.presentation.news.dto;

/**
 * DTO do autor da notícia.
 */
public record NewsAuthorResponse(
        String id,
        String name,
        String avatar,
        String role,
        String profileLink
) {}
