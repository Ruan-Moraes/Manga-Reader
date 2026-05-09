package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Resposta admin de grupo. Mapas *I18n trazem todas as traduções.
 */
public record AdminGroupResponse(
        UUID id,
        String name,
        String username,
        String logo,
        String description,
        Map<String, String> nameI18n,
        Map<String, String> descriptionI18n,
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
