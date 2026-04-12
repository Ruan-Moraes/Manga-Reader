package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.mangareader.application.subscription.port.GiftCodeRepositoryPort;
import com.mangareader.domain.subscription.entity.GiftCode;
import com.mangareader.infrastructure.persistence.postgres.repository.GiftCodeJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que implementa {@link GiftCodeRepositoryPort} com Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class GiftCodeRepositoryAdapter implements GiftCodeRepositoryPort {

    private final GiftCodeJpaRepository repository;

    @Override
    public GiftCode save(GiftCode giftCode) {
        return repository.save(giftCode);
    }

    @Override
    public Optional<GiftCode> findByCode(String code) {
        return repository.findByCode(code);
    }

    @Override
    public Optional<GiftCode> findById(UUID id) {
        return repository.findById(id);
    }
}
