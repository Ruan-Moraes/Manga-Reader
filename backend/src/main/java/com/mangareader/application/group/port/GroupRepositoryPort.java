package com.mangareader.application.group.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.group.entity.Group;

/**
 * Port de saída — acesso a dados de Groups (PostgreSQL).
 */
public interface GroupRepositoryPort {

    List<Group> findAll();

    Optional<Group> findById(UUID id);

    Optional<Group> findByUsername(String username);

    boolean existsByUsername(String username);

    Group save(Group group);

    void deleteById(UUID id);

    /**
     * Busca grupos que traduzem um determinado título.
     */
    List<Group> findByTitleId(String titleId);

    Page<Group> findByTitleId(String titleId, Pageable pageable);

    Page<Group> findAll(Pageable pageable);
}
