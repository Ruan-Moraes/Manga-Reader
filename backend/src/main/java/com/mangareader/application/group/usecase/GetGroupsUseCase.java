package com.mangareader.application.group.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional(readOnly = true)
    public Page<Group> execute(Pageable pageable) {
        Page<Group> page = groupRepository.findAll(pageable);

        page.getContent().forEach(group -> {
            group.getMembers().size();
            group.getTranslatedWorks().size();
        });

        return page;
    }
}
