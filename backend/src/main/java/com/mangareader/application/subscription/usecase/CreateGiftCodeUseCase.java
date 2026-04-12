package com.mangareader.application.subscription.usecase;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.subscription.port.GiftCodeRepositoryPort;
import com.mangareader.application.subscription.port.SubscriptionPlanRepositoryPort;
import com.mangareader.domain.subscription.entity.GiftCode;
import com.mangareader.domain.subscription.entity.SubscriptionPlan;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Cria um código de presente para o plano selecionado.
 * <p>
 * O código gerado é um UUID aleatório enviado ao e-mail do destinatário
 * (envio de e-mail é responsabilidade de outro serviço).
 */
@Service
@RequiredArgsConstructor
public class CreateGiftCodeUseCase {
    /** Validade padrão do código de presente: 1 ano a partir da criação. */
    private static final int GIFT_CODE_VALIDITY_YEARS = 1;

    private final SubscriptionPlanRepositoryPort planRepository;
    private final GiftCodeRepositoryPort giftCodeRepository;

    @Transactional
    public GiftCode execute(UUID senderUserId, UUID planId, String recipientEmail) {
        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new ResourceNotFoundException("SubscriptionPlan", "id", planId));

        GiftCode giftCode = GiftCode.builder()
                .code(UUID.randomUUID().toString())
                .plan(plan)
                .senderUserId(senderUserId)
                .recipientEmail(recipientEmail)
                .expiresAt(LocalDateTime.now().plusYears(GIFT_CODE_VALIDITY_YEARS))
                .build();

        return giftCodeRepository.save(giftCode);
    }
}
