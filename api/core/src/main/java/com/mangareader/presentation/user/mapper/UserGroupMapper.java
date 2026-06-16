package com.mangareader.presentation.user.mapper;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupUser;
import com.mangareader.domain.group.valueobject.GroupUserType;
import com.mangareader.presentation.shared.mapper.LocalizedMappingHelper;
import com.mangareader.presentation.user.dto.UserGroupsResponse;
import com.mangareader.presentation.user.dto.UserGroupsResponse.UserGroupItemResponse;

import lombok.RequiredArgsConstructor;

/**
 * Mapeia grupos (linked/available) para o DTO da aba "Grupos" do modal de perfil.
 * Bean por depender de {@link LocalizedMappingHelper} para resolver o nome i18n.
 */
@Component
@RequiredArgsConstructor
public class UserGroupMapper {
    private final LocalizedMappingHelper i18n;

    public UserGroupsResponse toResponse(List<Group> linked, List<Group> available, UUID userId) {
        return new UserGroupsResponse(
                linked.stream().map(g -> toItem(g, userId)).toList(),
                available.stream().map(g -> toItem(g, null)).toList()
        );
    }

    private UserGroupItemResponse toItem(Group group, UUID memberUserId) {
        List<GroupUser> groupUsers = group.getGroupUsers();

        long memberCount = groupUsers == null ? 0 : groupUsers.stream()
                .filter(gu -> gu.getType() == GroupUserType.MEMBER)
                .count();

        String role = memberUserId == null || groupUsers == null ? null : groupUsers.stream()
                .filter(gu -> gu.getType() == GroupUserType.MEMBER && gu.getUser().getId().equals(memberUserId))
                .map(gu -> gu.getRole() != null ? gu.getRole().getDisplayName() : null)
                .findFirst()
                .orElse(null);

        return new UserGroupItemResponse(
                group.getId().toString(),
                i18n.toResolvedString(group.getName()),
                group.getUsername(),
                group.getLogo(),
                role,
                memberCount
        );
    }
}
