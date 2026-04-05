package com.mangareader.application.group.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupUser;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.group.valueobject.GroupUserType;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Adiciona um membro a um grupo existente.
 */
@Service
@RequiredArgsConstructor
public class JoinGroupUseCase {

    private final GroupRepositoryPort groupRepository;
    private final UserRepositoryPort userRepository;

    public record JoinGroupInput(UUID groupId, UUID userId, GroupRole role) {}

    @Transactional
    public Group execute(JoinGroupInput input) {
        Group group = groupRepository.findById(input.groupId())
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", input.groupId()));

        User user = userRepository.findById(input.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", input.userId()));

        boolean alreadyLinked = group.getGroupUsers().stream()
                .anyMatch(gu -> gu.getUser().getId().equals(input.userId()));

        if (alreadyLinked) {
            throw new BusinessRuleException("Usuário já possui vínculo com este grupo.", 409);
        }

        GroupUser member = GroupUser.builder()
                .group(group)
                .user(user)
                .type(GroupUserType.MEMBER)
                .role(input.role() != null ? input.role() : GroupRole.TRADUTOR)
                .build();

        group.getGroupUsers().add(member);

        return groupRepository.save(group);
    }
}
