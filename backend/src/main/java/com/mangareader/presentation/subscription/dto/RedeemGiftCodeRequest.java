package com.mangareader.presentation.subscription.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Requisição para resgatar um código de presente.
 */
public record RedeemGiftCodeRequest(
        @NotBlank(message = "{validation.gift.code.required}") String code
) {}
