package com.mangareader.presentation.admin.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request para atualizar o status de uma assinatura (admin).
 */
public record UpdateSubscriptionStatusRequest(
        @NotBlank String status
) {}
