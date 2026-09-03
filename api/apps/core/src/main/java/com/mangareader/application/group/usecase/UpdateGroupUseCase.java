package com.mangareader.application.group.usecase;

import java.util.Map;
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
 * Atualiza informações de um grupo. Apenas o líder pode editar.
 */
@Service
@RequiredArgsConstructor
public class UpdateGroupUseCase {
    private final GroupRepositoryPort groupRepository;

    public record UpdateGroupInput(
            UUID groupId,
            UUID userId,
            Map<String, String> name,
            Map<String, String> description,
            String logo,
            String banner,
            String website
    ) {}

    @Transactional
    public Group execute(UpdateGroupInput input) {
        // Fetch join de groupUsers/user: o mapper roda fora da sessão (open-in-view off).
        Group group = groupRepository.findByIdWithUsers(input.groupId())
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", input.groupId()));

        verifyLeader(group, input.userId());

        GroupPatcher.apply(group, input.name(), input.description(),
                input.logo(), input.banner(), input.website());

        Group saved = groupRepository.save(group);
        saved.getTranslatedWorks().size();

        return saved;
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
