package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Resposta de um grupo para o painel admin.
 */
public record AdminGroupResponse(
        UUID id,
        String name,
        String username,
        String logo,
        String description,
        String status,
        int totalTitles,
        int membersCount,
        double rating,
        int popularity,
        LocalDateTime platformJoinedAt,
        List<GroupMemberResponse> members
) {
    public record GroupMemberResponse(
            UUID userId,
            String userName,
            String userEmail,
            String type,
            String role,
            LocalDateTime joinedAt
    ) {
    }
}
