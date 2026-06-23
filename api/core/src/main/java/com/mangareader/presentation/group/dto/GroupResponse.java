package com.mangareader.presentation.group.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * DTO completo de grupo retornado ao frontend.
 * <p>
 * Compatível com o frontend ({@code Group} em group.types.ts).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record GroupResponse(
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
        List<GroupMemberResponse> members,
        List<GroupSupporterResponse> supporters,
        List<String> genres,
        List<String> focusTags,
        double rating,
        int popularity,
        List<GroupWorkResponse> translatedWorks
) {}
