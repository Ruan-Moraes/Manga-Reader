package com.mangareader.application.user.port;

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
