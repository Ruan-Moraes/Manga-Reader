package com.mangareader.presentation.admin.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Requisição para atualização de status de pagamento.
 */
public record UpdatePaymentStatusRequest(
        @NotBlank(message = "Status é obrigatório")
        String status
) {
}
