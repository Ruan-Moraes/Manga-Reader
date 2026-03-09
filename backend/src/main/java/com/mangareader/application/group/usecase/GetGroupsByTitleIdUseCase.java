package com.mangareader.application.group.usecase;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;

import lombok.RequiredArgsConstructor;

/**
 * Busca grupos que traduzem um determinado título (titleId do MongoDB).
 */
@Service
@RequiredArgsConstructor
public class GetGroupsByTitleIdUseCase {

    private final GroupRepositoryPort groupRepository;

    public List<Group> execute(String titleId) {
        return groupRepository.findByTitleId(titleId);
    }
}
