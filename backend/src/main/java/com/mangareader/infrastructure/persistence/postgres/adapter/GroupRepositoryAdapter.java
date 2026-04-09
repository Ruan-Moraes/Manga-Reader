package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.infrastructure.persistence.postgres.repository.GroupJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de Group ao Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class GroupRepositoryAdapter implements GroupRepositoryPort {
    private final GroupJpaRepository repository;

    @Override
    public List<Group> findAll() {
        return repository.findAll();
    }

    @Override
    public Optional<Group> findById(UUID id) {
        return repository.findById(id);
    }

    @Override
    public Optional<Group> findByUsername(String username) {
        return repository.findByUsername(username);
    }

    @Override
    public Optional<Group> findByIdWithUsers(UUID id) {
        return repository.findByIdWithUsers(id);
    }

    @Override
    public Optional<Group> findByUsernameWithUsers(String username) {
        return repository.findByUsernameWithUsers(username);
    }

    @Override
    public Page<Group> findAllWithUsers(Pageable pageable) {
        Page<UUID> idsPage = repository.findAllIds(pageable);

        if (idsPage.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, 0);
        }

        List<Group> groups = repository.findAllWithUsersByIds(idsPage.getContent());

        return new PageImpl<>(groups, pageable, idsPage.getTotalElements());
    }

    @Override
    public boolean existsByUsername(String username) {
        return repository.existsByUsername(username);
    }

    @Override
    public Group save(Group group) {
        return repository.save(group);
    }

    @Override
    public void deleteById(UUID id) {
        repository.deleteById(id);
    }

    @Override
    public List<Group> findByTitleId(String titleId) {
        return repository.findByTitleId(titleId);
    }

    @Override
    public Page<Group> findByTitleId(String titleId, Pageable pageable) {
        return repository.findByTitleId(titleId, pageable);
    }

    @Override
    public Page<Group> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Override
    public long count() {
        return repository.count();
    }
}
