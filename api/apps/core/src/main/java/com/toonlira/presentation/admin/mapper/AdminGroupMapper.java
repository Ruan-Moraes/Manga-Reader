package com.toonlira.presentation.admin.mapper;

import java.util.List;
import java.util.Map;

import com.toonlira.domain.group.entity.Group;
import com.toonlira.domain.group.entity.GroupUser;
import com.toonlira.presentation.admin.dto.AdminGroupResponse;
import com.toonlira.shared.domain.i18n.LocalizedString;

/**
 * Mapper estático Group → AdminGroupResponse.
 */
public final class AdminGroupMapper {

    private AdminGroupMapper() {
    }

    public static AdminGroupResponse toResponse(Group group) {
        return toResponse(group, false);
    }

    public static AdminGroupResponse toDetailResponse(Group group) {
        return toResponse(group, true);
    }

    private static AdminGroupResponse toResponse(Group group, boolean includeMembers) {
        List<AdminGroupResponse.GroupMemberResponse> members = includeMembers && group.getGroupUsers() != null
                ? group.getGroupUsers().stream().map(AdminGroupMapper::toMemberResponse).toList()
                : List.of();

        return new AdminGroupResponse(
                group.getId(),
                values(group.getName()),
                group.getUsername(),
                group.getLogo(),
                values(group.getDescription()),
                group.getStatus() != null ? group.getStatus().name() : null,
                group.getTotalTitles(),
                group.getGroupUsers() != null ? group.getGroupUsers().size() : 0,
                group.getRating(),
                group.getPopularity(),
                group.getPlatformJoinedAt(),
                members
        );
    }

    private static Map<String, String> values(LocalizedString s) {
        return s == null ? Map.of() : s.values();
    }

    private static AdminGroupResponse.GroupMemberResponse toMemberResponse(GroupUser gu) {
        return new AdminGroupResponse.GroupMemberResponse(
                gu.getUser().getId(),
                gu.getUser().getName(),
                gu.getUser().getEmail(),
                gu.getType() != null ? gu.getType().name() : null,
                gu.getRole() != null ? gu.getRole().name() : null,
                gu.getJoinedAt()
        );
    }
}
