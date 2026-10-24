package com.toonlira.application.group.usecase.admin;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.group.port.GroupRepositoryPort;
import com.toonlira.domain.group.entity.Group;
import com.toonlira.domain.group.entity.GroupUser;
import com.toonlira.domain.group.valueobject.GroupRole;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Altera o role de um membro dentro de um grupo (admin bypassa ownership check).
 */
@Service
@RequiredArgsConstructor
public class AdminChangeGroupMemberRoleUseCase {
    private final GroupRepositoryPort groupRepository;

    @Transactional
    public Group execute(UUID groupId, UUID userId, GroupRole newRole) {
        Group group = groupRepository.findByIdWithUsers(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));

        GroupUser member = group.getGroupUsers().stream()
                .filter(gu -> gu.getUser().getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("GroupUser", "userId", userId));

        member.setRole(newRole);

        return groupRepository.save(group);
    }
}
