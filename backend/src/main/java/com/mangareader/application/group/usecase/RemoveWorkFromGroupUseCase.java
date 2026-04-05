package com.mangareader.application.group.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupWork;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.group.valueobject.GroupUserType;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Remove uma obra do portfólio de trabalhos traduzidos do grupo.
 * <p>
 * Somente o líder do grupo pode remover obras.
 */
@Service
@RequiredArgsConstructor
public class RemoveWorkFromGroupUseCase {
    private final GroupRepositoryPort groupRepository;

    public Group execute(UUID groupId, UUID userId, String titleId) {
        Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));

        verifyLeader(group, userId);

        GroupWork work = group.getTranslatedWorks().stream()
                .filter(w -> w.getTitleId().equals(titleId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("GroupWork", "titleId", titleId));

        group.getTranslatedWorks().remove(work);
        group.setTotalTitles(Math.max(0, group.getTotalTitles() - 1));

        return groupRepository.save(group);
    }

    private void verifyLeader(Group group, UUID userId) {
        boolean isLeader = group.getGroupUsers().stream()
                .anyMatch(gu -> gu.getType() == GroupUserType.MEMBER
                        && gu.getUser().getId().equals(userId)
                        && gu.getRole() == GroupRole.LIDER);
        if (!isLeader) {
            throw new BusinessRuleException("Somente o líder pode remover obras do grupo", 403);
        }
    }
}
