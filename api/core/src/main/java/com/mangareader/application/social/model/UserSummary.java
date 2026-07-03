package com.mangareader.application.social.model;

import com.mangareader.domain.user.entity.User;

/**
 * Read model das listas sociais (DT-48): projeção mínima do usuário para
 * cards de seguidores/seguindo, hidratada do Postgres.
 */
public record UserSummary(
        String id,
        String name,
        String username,
        String photoUrl,
        boolean verified
) {
    public static UserSummary from(User user) {
        return new UserSummary(
                user.getId().toString(),
                user.getName(),
                user.getUsername(),
                user.getPhotoUrl(),
                user.isVerified());
    }
}
