package com.mangareader.application.group.usecase;

import org.springframework.stereotype.Service;

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

    public Group execute(String username) {
        return groupRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Group", "username", username));
    }
}
