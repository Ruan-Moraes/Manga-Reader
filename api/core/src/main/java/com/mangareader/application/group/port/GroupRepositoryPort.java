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

    Optional<Group> findByIdWithUsers(UUID id);

    Optional<Group> findByUsernameWithUsers(String username);

    Page<Group> findAllWithUsers(Pageable pageable);

    boolean existsByUsername(String username);

    Group save(Group group);

    void deleteById(UUID id);

    List<Group> findByTitleId(String titleId);

    Page<Group> findByTitleId(String titleId, Pageable pageable);

    /**
     * Remove de todos os grupos as obras que referenciam o título e reconcilia
     * {@code total_titles} dos grupos afetados (limpeza de órfão cross-DB).
     */
    void deleteWorksByTitleId(String titleId);

    List<Group> findGroupsByMemberUserId(UUID userId);

    /** DT-48: grupos que o usuário segue/apoia (GroupUserType.SUPPORTER). */
    List<Group> findGroupsBySupporterUserId(UUID userId);

    List<Group> findAvailableGroupsForUser(UUID userId);

    Page<Group> findAll(Pageable pageable);

    Page<Group> searchByName(String query, Pageable pageable);

    long count();
}
