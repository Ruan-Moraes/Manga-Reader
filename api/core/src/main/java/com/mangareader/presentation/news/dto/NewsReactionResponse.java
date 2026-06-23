package com.mangareader.presentation.news.dto;

/**
 * DTO de reações de uma notícia.
 */
public record NewsReactionResponse(
        int like,
        int excited,
        int sad,
        int surprised
) {}
