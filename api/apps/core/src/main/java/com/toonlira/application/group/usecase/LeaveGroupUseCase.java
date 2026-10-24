package com.toonlira.application.group.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.group.port.GroupRepositoryPort;
import com.toonlira.domain.group.entity.Group;
import com.toonlira.domain.group.entity.GroupUser;
import com.toonlira.domain.group.valueobject.GroupRole;
import com.toonlira.domain.group.valueobject.GroupUserType;
import com.toonlira.shared.exception.BusinessRuleException;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Remove o usuário autenticado de um grupo.
 * <p>
 * O líder não pode sair — deve transferir a liderança antes.
 */
@Service
@RequiredArgsConstructor
public class LeaveGroupUseCase {
    private final GroupRepositoryPort groupRepository;

    @Transactional
    public Group execute(UUID groupId, UUID userId) {
        // Fetch join de groupUsers/user: o mapper roda fora da sessão (open-in-view off).
        Group group = groupRepository.findByIdWithUsers(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));

        GroupUser member = group.getGroupUsers().stream()
                .filter(gu -> gu.getType() == GroupUserType.MEMBER && gu.getUser().getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new BusinessRuleException("Você não é membro deste grupo", 400));

        if (member.getRole() == GroupRole.LIDER) {
            throw new BusinessRuleException(
                    "O líder não pode sair do grupo. Transfira a liderança antes.", 400);
        }

        group.getGroupUsers().remove(member);

        Group saved = groupRepository.save(group);
        saved.getTranslatedWorks().size();

        return saved;
    }
}
