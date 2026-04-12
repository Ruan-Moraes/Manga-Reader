package com.mangareader.application.subscription.usecase;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.GiftCodeRepositoryPort;
import com.mangareader.application.subscription.port.SubscriptionRepositoryPort;
import com.mangareader.domain.subscription.entity.GiftCode;
import com.mangareader.domain.subscription.entity.Subscription;
import com.mangareader.domain.subscription.valueobject.GiftCodeStatus;
import com.mangareader.domain.subscription.valueobject.SubscriptionPeriod;
import com.mangareader.domain.subscription.valueobject.SubscriptionStatus;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Resgata um código de presente, criando uma nova assinatura para o usuário.
 */
@Service
@RequiredArgsConstructor
public class RedeemGiftCodeUseCase {

    private static final int DAILY_DURATION_DAYS = 1;
    private static final int MONTHLY_DURATION_MONTHS = 1;
    private static final int ANNUAL_DURATION_YEARS = 1;

    private final GiftCodeRepositoryPort giftCodeRepository;
    private final SubscriptionRepositoryPort subscriptionRepository;

    @Transactional
    public Subscription execute(UUID userId, String code) {
        GiftCode giftCode = giftCodeRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("GiftCode", "code", code));

        validateGiftCode(giftCode);

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endDate = calculateEndDate(now, giftCode.getPlan().getPeriod());

        Subscription subscription = Subscription.builder()
                .userId(userId)
                .plan(giftCode.getPlan())
                .startDate(now)
                .endDate(endDate)
                .status(SubscriptionStatus.ACTIVE)
                .build();

        Subscription saved = subscriptionRepository.save(subscription);

        giftCode.setStatus(GiftCodeStatus.REDEEMED);
        giftCode.setRedeemedByUserId(userId);
        giftCode.setRedeemedAt(now);
        giftCodeRepository.save(giftCode);

        return saved;
    }

    private void validateGiftCode(GiftCode giftCode) {
        if (giftCode.getStatus() == GiftCodeStatus.REDEEMED) {
            throw new BusinessRuleException("Este código de presente já foi utilizado.");
        }
        if (giftCode.getStatus() == GiftCodeStatus.EXPIRED
                || giftCode.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessRuleException("Este código de presente está expirado.");
        }
    }

    private LocalDateTime calculateEndDate(LocalDateTime start, SubscriptionPeriod period) {
        return switch (period) {
            case DAILY -> start.plusDays(DAILY_DURATION_DAYS);
            case MONTHLY -> start.plusMonths(MONTHLY_DURATION_MONTHS);
            case ANNUAL -> start.plusYears(ANNUAL_DURATION_YEARS);
        };
    }
}
