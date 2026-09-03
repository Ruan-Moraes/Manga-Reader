package com.mangareader.presentation.social.dto;

import com.mangareader.application.social.model.UserSummary;

/** Card mínimo de usuário nas listas de seguidores/seguindo (DT-48). */
public record UserSummaryResponse(
        String id,
        String name,
        String username,
        String photoUrl,
        boolean verified
) {
    public static UserSummaryResponse from(UserSummary summary) {
        return new UserSummaryResponse(
                summary.id(), summary.name(), summary.username(), summary.photoUrl(), summary.verified());
    }
}
