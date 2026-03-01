package com.mangareader.application.user.port;

import java.util.Optional;
import java.util.UUID;

import com.mangareader.domain.user.entity.User;

/**
 * Port de saída — acesso a dados de Users (PostgreSQL).
 */
public interface UserRepositoryPort {

    Optional<User> findById(UUID id);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    User save(User user);

    void deleteById(UUID id);
}
