package com.toonlira.application.group.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.group.port.GroupRepositoryPort;
import com.toonlira.domain.group.entity.Group;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Retorna um grupo pelo username (slug).
 */
@Service
@RequiredArgsConstructor
public class GetGroupByUsernameUseCase {
    private final GroupRepositoryPort groupRepository;

    @Transactional(readOnly = true)
    public Group execute(String username) {
        Group group = groupRepository.findByUsernameWithUsers(username)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "username", username));

        group.getTranslatedWorks().size();

        return group;
    }
}
