package com.mangareader.application.subscription.port;

import java.util.Optional;
import java.util.UUID;

import com.mangareader.domain.subscription.entity.GiftCode;

/**
 * Port de saída — acesso a dados de GiftCodes (PostgreSQL).
 */
public interface GiftCodeRepositoryPort {
    GiftCode save(GiftCode giftCode);

    Optional<GiftCode> findByCode(String code);

    Optional<GiftCode> findById(UUID id);
}
