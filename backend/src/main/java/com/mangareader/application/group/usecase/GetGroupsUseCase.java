package com.mangareader.application.group.usecase;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todos os grupos de tradução.
 */
@Service
@RequiredArgsConstructor
public class GetGroupsUseCase {

    private final GroupRepositoryPort groupRepository;

    public List<Group> execute() {
        return groupRepository.findAll();
    }
}
