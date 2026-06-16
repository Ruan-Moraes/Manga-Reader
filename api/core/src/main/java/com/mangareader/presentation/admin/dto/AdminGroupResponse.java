package com.mangareader.presentation.admin.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Resposta admin de grupo. Mapas {@code name}/{@code description} expõem
 * todas as traduções para edição multilíngue.
 */
public record AdminGroupResponse(
        UUID id,
        Map<String, String> name,
        String username,
        String logo,
        Map<String, String> description,
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
