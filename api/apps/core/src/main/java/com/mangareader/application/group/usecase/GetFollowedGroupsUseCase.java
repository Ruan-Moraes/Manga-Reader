package com.mangareader.application.group.usecase;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;

import lombok.RequiredArgsConstructor;

/**
 * Grupos que um usuário segue — alimenta a seção "grupos seguidos" do perfil
 * público (DT-48). Um membro (GroupUserType.MEMBER) já é considerado seguidor
 * automaticamente, então a lista une membros e apoiadores (GroupUserType.SUPPORTER).
 */
@Service
@RequiredArgsConstructor
public class GetFollowedGroupsUseCase {
    private final GroupRepositoryPort groupRepository;

    @Transactional(readOnly = true)
    public List<Group> execute(UUID userId) {
        Map<UUID, Group> byId = new LinkedHashMap<>();

        for (Group group : groupRepository.findGroupsByMemberUserId(userId)) {
            byId.put(group.getId(), group);
        }

        for (Group group : groupRepository.findGroupsBySupporterUserId(userId)) {
            byId.putIfAbsent(group.getId(), group);
        }

        return new ArrayList<>(byId.values());
    }
}
