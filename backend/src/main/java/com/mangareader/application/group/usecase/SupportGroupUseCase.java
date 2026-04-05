package com.mangareader.application.group.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupUser;
import com.mangareader.domain.group.valueobject.GroupUserType;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Adiciona o usuário como apoiador de um grupo.
 */
@Service
@RequiredArgsConstructor
public class SupportGroupUseCase {
    private final GroupRepositoryPort groupRepository;
    private final UserRepositoryPort userRepository;

    @Transactional
    public Group execute(UUID groupId, UUID userId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        boolean alreadyLinked = group.getGroupUsers().stream()
                .anyMatch(gu -> gu.getUser().getId().equals(userId));

        if (alreadyLinked) {
            throw new BusinessRuleException("Usuário já possui vínculo com este grupo.", 409);
        }

        GroupUser supporter = GroupUser.builder()
                .group(group)
                .user(user)
                .type(GroupUserType.SUPPORTER)
                .build();

        group.getGroupUsers().add(supporter);

        return groupRepository.save(group);
    }
}
