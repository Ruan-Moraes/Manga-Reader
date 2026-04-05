package com.mangareader.application.group.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.shared.exception.ResourceNotFoundException;

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
