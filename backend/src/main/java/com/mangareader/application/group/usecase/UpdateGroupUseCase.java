package com.mangareader.application.group.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.group.valueobject.GroupUserType;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza informações de um grupo.
 * <p>
 * Somente o líder do grupo pode editá-lo.
 */
@Service
@RequiredArgsConstructor
public class UpdateGroupUseCase {
    private final GroupRepositoryPort groupRepository;

    public record UpdateGroupInput(
            UUID groupId,
            UUID userId,
            String name,
            String description,
            String logo,
            String banner,
            String website
    ) {}

    @Transactional
    public Group execute(UpdateGroupInput input) {
        Group group = groupRepository.findById(input.groupId())
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", input.groupId()));

        verifyLeader(group, input.userId());

        if (input.name() != null) {
            group.setName(input.name());
        }

        if (input.description() != null) {
            group.setDescription(input.description());
        }

        if (input.logo() != null) {
            group.setLogo(input.logo());
        }

        if (input.banner() != null) {
            group.setBanner(input.banner());
        }

        if (input.website() != null) {
            group.setWebsite(input.website());
        }

        return groupRepository.save(group);
    }

    private void verifyLeader(Group group, UUID userId) {
        boolean isLeader = group.getGroupUsers().stream()
                .anyMatch(gu -> gu.getType() == GroupUserType.MEMBER
                        && gu.getUser().getId().equals(userId)
                        && gu.getRole() == GroupRole.LIDER);

        if (!isLeader) {
            throw new BusinessRuleException("Somente o líder pode editar o grupo", 403);
        }
    }
}
