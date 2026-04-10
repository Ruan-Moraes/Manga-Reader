package com.mangareader.presentation.admin.mapper;

import java.util.List;

import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupUser;
import com.mangareader.presentation.admin.dto.AdminGroupResponse;

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
                group.getName(),
                group.getUsername(),
                group.getLogo(),
                group.getDescription(),
                group.getStatus() != null ? group.getStatus().name() : null,
                group.getTotalTitles(),
                group.getGroupUsers() != null ? group.getGroupUsers().size() : 0,
                group.getRating(),
                group.getPopularity(),
                group.getPlatformJoinedAt(),
                members
        );
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
