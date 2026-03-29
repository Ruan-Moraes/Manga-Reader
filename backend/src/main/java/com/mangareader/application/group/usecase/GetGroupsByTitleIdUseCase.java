package com.mangareader.application.group.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    public Page<Group> execute(String titleId, Pageable pageable) {
        return groupRepository.findByTitleId(titleId, pageable);
    }
}
