package com.toonlira.infrastructure.persistence.postgres.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.toonlira.domain.subscription.entity.GiftCode;

public interface GiftCodeJpaRepository extends JpaRepository<GiftCode, UUID> {
    Optional<GiftCode> findByCode(String code);
}
