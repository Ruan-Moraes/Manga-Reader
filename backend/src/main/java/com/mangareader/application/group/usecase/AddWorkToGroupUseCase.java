package com.mangareader.application.group.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupMember;
import com.mangareader.domain.group.entity.GroupWork;
import com.mangareader.domain.group.valueobject.GroupWorkStatus;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Adiciona uma obra (título) ao portfólio de trabalhos traduzidos do grupo.
 * <p>
 * Requer que o usuário seja membro do grupo.
 */
@Service
@RequiredArgsConstructor
public class AddWorkToGroupUseCase {

    private final GroupRepositoryPort groupRepository;

    public record AddWorkInput(
            UUID groupId,
            UUID userId,
            String titleId,
            String title,
            String cover,
            int chapters,
            String status,
            List<String> genres
    ) {}

    public Group execute(AddWorkInput input) {
        Group group = groupRepository.findById(input.groupId())
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", input.groupId()));

        verifyMembership(group, input.userId());

        // Verifica se o título já está no grupo
        boolean alreadyExists = group.getTranslatedWorks().stream()
                .anyMatch(w -> w.getTitleId().equals(input.titleId()));
        if (alreadyExists) {
            throw new BusinessRuleException("Este título já está no portfólio do grupo", 409);
        }

        GroupWorkStatus workStatus = parseStatus(input.status());

        GroupWork work = GroupWork.builder()
                .group(group)
                .titleId(input.titleId())
                .title(input.title())
                .cover(input.cover())
                .chapters(input.chapters())
                .status(workStatus)
                .genres(input.genres() != null ? input.genres() : List.of())
                .build();

        group.getTranslatedWorks().add(work);
        group.setTotalTitles(group.getTotalTitles() + 1);

        return groupRepository.save(group);
    }

    private void verifyMembership(Group group, UUID userId) {
        boolean isMember = group.getMembers().stream()
                .anyMatch(m -> m.getUser().getId().equals(userId));
        if (!isMember) {
            throw new BusinessRuleException("Você precisa ser membro do grupo para adicionar obras", 403);
        }
    }

    private GroupWorkStatus parseStatus(String status) {
        if (status == null) return GroupWorkStatus.ONGOING;
        try {
            return GroupWorkStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return GroupWorkStatus.ONGOING;
        }
    }
}
