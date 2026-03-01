package com.mangareader.application.group.port;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
}
