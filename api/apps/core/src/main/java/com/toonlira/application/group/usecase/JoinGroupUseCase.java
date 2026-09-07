package com.toonlira.application.group.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.group.port.GroupRepositoryPort;
import com.toonlira.application.user.port.UserRepositoryPort;
import com.toonlira.domain.group.entity.Group;
import com.toonlira.domain.group.entity.GroupUser;
import com.toonlira.domain.group.valueobject.GroupRole;
import com.toonlira.domain.group.valueobject.GroupUserType;
import com.toonlira.domain.user.entity.User;
import com.toonlira.shared.exception.BusinessRuleException;
import com.toonlira.shared.exception.ResourceNotFoundException;

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
        // Fetch join de groupUsers/user: o mapper roda fora da sessão (open-in-view off).
        Group group = groupRepository.findByIdWithUsers(input.groupId())
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

        Group saved = groupRepository.save(group);
        saved.getTranslatedWorks().size();

        return saved;
    }
}
