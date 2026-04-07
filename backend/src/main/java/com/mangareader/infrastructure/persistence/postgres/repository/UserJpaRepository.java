package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mangareader.domain.user.entity.User;

/**
 * Spring Data JPA Repository para Users.
 */
public interface UserJpaRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
