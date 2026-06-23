package com.mangareader.application.user.port;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;

/**
 * Port de saída — acesso a dados de Users (PostgreSQL).
 */
public interface UserRepositoryPort {
    Optional<User> findById(UUID id);

    /** Busca em lote — resolve autores de uma página de UGC numa única query (sem N+1). */
    List<User> findAllById(Collection<UUID> ids);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    User save(User user);

    void deleteById(UUID id);

    Page<User> findAll(Pageable pageable);

    Page<User> searchByNameOrEmail(String query, Pageable pageable);

    long count();

    long countByRole(UserRole role);

    long countByBannedTrue();
}
