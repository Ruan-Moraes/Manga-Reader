package com.mangareader.infrastructure.persistence.postgres.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mangareader.domain.user.entity.UserProfileSettings;

/**
 * Spring Data JPA Repository para configurações de perfil do usuário.
 */
public interface UserProfileSettingsJpaRepository extends JpaRepository<UserProfileSettings, UUID> {
}
