package com.mangareader.presentation.user.dto;

/**
 * Request para atualizar configurações de privacidade.
 */
public record UpdatePrivacyRequest(
        String commentVisibility,
        String viewHistoryVisibility
) {}
