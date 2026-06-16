package com.mangareader.application.user.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;

import lombok.RequiredArgsConstructor;

/**
 * Retorna os grupos de scan vinculados ao usuário e os demais disponíveis,
 * para a aba "Grupos" do modal de edição de perfil.
 */
@Service
@RequiredArgsConstructor
public class GetUserGroupsUseCase {
    private final GroupRepositoryPort groupRepository;

    public record UserGroups(List<Group> linked, List<Group> available) {}

    @Transactional(readOnly = true)
    public UserGroups execute(UUID userId) {
        List<Group> linked = groupRepository.findGroupsByMemberUserId(userId);
        List<Group> available = groupRepository.findAvailableGroupsForUser(userId);

        return new UserGroups(linked, available);
    }
}
