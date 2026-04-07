package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.infrastructure.persistence.postgres.repository.UserJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port {@link UserRepositoryPort} ao Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class UserRepositoryAdapter implements UserRepositoryPort {
    private final UserJpaRepository jpaRepository;

    @Override
    public Optional<User> findById(UUID id) {
        return jpaRepository.findById(id);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return jpaRepository.findByEmail(email);
    }

    @Override
    public boolean existsByEmail(String email) {
        return jpaRepository.existsByEmail(email);
    }

    @Override
    public User save(User user) {
        return jpaRepository.save(user);
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }
}
