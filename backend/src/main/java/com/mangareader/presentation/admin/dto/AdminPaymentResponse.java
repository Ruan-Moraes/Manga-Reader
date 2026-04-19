package com.mangareader.presentation.admin.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Resposta de um pagamento para o painel admin.
 */
public record AdminPaymentResponse(
        UUID id,
        UUID userId,
        BigDecimal amount,
        String currency,
        String status,
        String paymentMethod,
        String description,
        String referenceType,
        String referenceId,
        LocalDateTime paidAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
