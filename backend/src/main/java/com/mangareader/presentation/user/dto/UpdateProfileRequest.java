package com.mangareader.presentation.user.dto;

import java.util.List;

import jakarta.validation.constraints.Size;

/**
 * Request para atualização de perfil.
 * <p>
 * Campos nulos são ignorados (PATCH semântico).
 */
public record UpdateProfileRequest(
        @Size(min = 2, max = 100, message = "{validation.name.size}")
        String name,

        @Size(max = 500, message = "{validation.user.bio.size}")
        String bio,

        String photoUrl,

        String bannerUrl,

        List<SocialLinkInput> socialLinks
) {
    public record SocialLinkInput(
            String platform,
            String url
    ) {}
}
