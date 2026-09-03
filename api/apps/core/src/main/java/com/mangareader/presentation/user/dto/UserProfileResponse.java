package com.mangareader.presentation.user.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Response de perfil de usuário.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserProfileResponse(
        String id,
        String name,
        String email,
        String bio,
        String photoUrl,
        String role,
        List<SocialLinkResponse> socialLinks,
        LocalDateTime createdAt
) {
    public record SocialLinkResponse(
            String id,
            String platform,
            String url
    ) {}
}
