package com.toonlira.infrastructure.persistence.postgres.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.toonlira.domain.user.entity.UserSystemSettings;

/**
 * Spring Data JPA Repository para configurações de sistema do usuário.
 */
public interface UserSystemSettingsJpaRepository extends JpaRepository<UserSystemSettings, UUID> {
}
