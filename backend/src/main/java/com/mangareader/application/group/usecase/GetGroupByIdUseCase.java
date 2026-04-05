package com.mangareader.application.group.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.shared.exception.ResourceNotFoundException;

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
