package com.toonlira.presentation.user.dto;

/**
 * Request para atualizar configurações de privacidade.
 */
public record UpdatePrivacyRequest(
        String commentVisibility,
        String viewHistoryVisibility,
        String libraryVisibility,
        String adultContentPreference,
        Boolean behaviorAnalyticsEnabled
) {}
