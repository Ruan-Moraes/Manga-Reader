package com.mangareader.presentation.user.dto;

import java.util.List;

import jakarta.validation.constraints.Size;

/**
 * Request para atualização de perfil.
 * <p>
 * Campos nulos são ignorados (PATCH semântico).
 */
public record UpdateProfileRequest(
        @Size(min = 2, max = 100, message = "Nome deve ter entre 2 e 100 caracteres")
        String name,

        @Size(max = 500, message = "Bio deve ter no máximo 500 caracteres")
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
