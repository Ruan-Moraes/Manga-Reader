package com.mangareader.application.group.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupUser;
import com.mangareader.domain.group.valueobject.GroupUserType;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Remove o vínculo de apoiador do usuário com um grupo.
 */
@Service
@RequiredArgsConstructor
public class UnsupportGroupUseCase {
    private final GroupRepositoryPort groupRepository;

    @Transactional
    public Group execute(UUID groupId, UUID userId) {
        // Fetch join de groupUsers/user: o mapper roda fora da sessão (open-in-view off).
        Group group = groupRepository.findByIdWithUsers(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));

        var existingLink = group.getGroupUsers().stream()
                .filter(gu -> gu.getUser().getId().equals(userId))
                .findFirst();

        if (existingLink.isPresent() && existingLink.get().getType() == GroupUserType.MEMBER) {
            throw new BusinessRuleException("Você é membro deste grupo — saia do grupo para deixar de segui-lo.", 400);
        }

        GroupUser supporter = existingLink
                .filter(gu -> gu.getType() == GroupUserType.SUPPORTER)
                .orElseThrow(() -> new BusinessRuleException("Você não é apoiador deste grupo", 400));

        group.getGroupUsers().remove(supporter);

        Group saved = groupRepository.save(group);
        saved.getTranslatedWorks().size();

        return saved;
    }
}
