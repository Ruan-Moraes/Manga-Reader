package com.mangareader.application.group.usecase.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;

import lombok.RequiredArgsConstructor;

/**
 * Lista grupos paginados com busca opcional por nome (admin).
 * <p>
 * Transactional para permitir que o mapper acesse a coleção lazy {@code groupUsers}
 * (usada para calcular {@code membersCount}).
 */
@Service
@RequiredArgsConstructor
public class AdminListGroupsUseCase {

    private final GroupRepositoryPort groupRepository;

    @Transactional(readOnly = true)
    public Page<Group> execute(String search, Pageable pageable) {
        Page<Group> page = (search != null && !search.isBlank())
                ? groupRepository.searchByName(search, pageable)
                : groupRepository.findAll(pageable);

        page.getContent().forEach(group -> group.getGroupUsers().size());

        return page;
    }
}
