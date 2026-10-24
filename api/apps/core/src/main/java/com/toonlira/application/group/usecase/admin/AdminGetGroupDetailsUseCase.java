package com.toonlira.application.group.usecase.admin;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.group.port.GroupRepositoryPort;
import com.toonlira.domain.group.entity.Group;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Retorna detalhes de um grupo com membros carregados (admin).
 */
@Service
@RequiredArgsConstructor
public class AdminGetGroupDetailsUseCase {
    private final GroupRepositoryPort groupRepository;

    @Transactional(readOnly = true)
    public Group execute(UUID groupId) {
        Group group = groupRepository.findByIdWithUsers(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", groupId));

        group.getGroupUsers().size();
        group.getTranslatedWorks().size();

        return group;
    }
}
