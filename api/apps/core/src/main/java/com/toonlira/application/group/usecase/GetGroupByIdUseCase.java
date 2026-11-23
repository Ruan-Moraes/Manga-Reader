package com.toonlira.application.group.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.group.port.GroupRepositoryPort;
import com.toonlira.domain.group.entity.Group;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Retorna um grupo pelo ID.
 */
@Service
@RequiredArgsConstructor
public class GetGroupByIdUseCase {
    private final GroupRepositoryPort groupRepository;

    @Transactional(readOnly = true)
    public Group execute(UUID id) {
        Group group = groupRepository.findByIdWithUsers(id)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "id", id));

        group.getTranslatedWorks().size();

        return group;
    }
}
