package com.mangareader.application.group.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;

import lombok.RequiredArgsConstructor;

/**
 * Grupos que um usuário segue/apoia (GroupUserType.SUPPORTER) — alimenta a
 * seção "grupos seguidos" do perfil público (DT-48).
 */
@Service
@RequiredArgsConstructor
public class GetFollowedGroupsUseCase {
    private final GroupRepositoryPort groupRepository;

    @Transactional(readOnly = true)
    public List<Group> execute(UUID userId) {
        return groupRepository.findGroupsBySupporterUserId(userId);
    }
}
