package com.mangareader.application.social.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.social.port.SocialGraphPort;
import com.mangareader.application.social.port.SocialGraphPort.ProfileSocial;

import lombok.RequiredArgsConstructor;

/**
 * Deixa de seguir um usuário (DT-48). Idempotente — remover uma aresta
 * inexistente é no-op (não valida existência do alvo: o unfollow deve
 * funcionar mesmo para contas já removidas).
 */
@Service
@RequiredArgsConstructor
public class UnfollowUserUseCase {
    private final SocialGraphPort socialGraph;

    public ProfileSocial execute(UUID followerId, UUID followeeId) {
        socialGraph.unfollow(followerId, followeeId);

        return socialGraph.getProfileSocial(followeeId, followerId);
    }
}
