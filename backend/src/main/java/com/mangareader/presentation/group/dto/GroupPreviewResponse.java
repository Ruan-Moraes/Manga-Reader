package com.mangareader.presentation.group.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO de grupo (versão de preview) retornado ao frontend sem os campos
 * `members` e `translatedWorks`.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record GroupPreviewResponse(
        String id,
        String name,
        String username,
        String logo,
        String banner,
        String description,
        String website,
        int totalTitles,
        Integer foundedYear,
        String platformJoinedAt,
        String status,
        List<String> genres,
        List<String> focusTags,
        double rating,
        int popularity
) {}

