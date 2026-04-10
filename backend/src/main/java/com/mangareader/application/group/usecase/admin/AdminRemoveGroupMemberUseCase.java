package com.mangareader.application.group.usecase.admin;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupUser;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Remove um membro de um grupo (admin bypassa ownership check).
 */
@Service
@RequiredArgsConstructor
public class AdminRemoveGroupMemberUseCase {

    private final GroupRepositoryPort groupRepository;

    @Transactional
    public Group execute(UUID groupId, UUID userId) {
        Group group = groupRepository.findByIdWithUsers(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));

        GroupUser member = group.getGroupUsers().stream()
                .filter(gu -> gu.getUser().getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("GroupUser", "userId", userId));

        group.getGroupUsers().remove(member);

        return groupRepository.save(group);
    }
}
