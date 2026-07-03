package com.mangareader.application.social.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.social.port.SocialGraphPort;
import com.mangareader.application.social.port.SocialGraphPort.ProfileSocial;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Segue um usuário (DT-48). Idempotente (MERGE no grafo); o alvo precisa
 * existir e estar ativo no Postgres — o grafo cria os nós lazy.
 */
@Service
@RequiredArgsConstructor
public class FollowUserUseCase {
    private final SocialGraphPort socialGraph;
    private final UserRepositoryPort userRepository;

    public ProfileSocial execute(UUID followerId, UUID followeeId) {
        if (followerId.equals(followeeId)) {
            throw new BusinessRuleException("Não é possível seguir a si mesmo", 409);
        }

        User target = userRepository.findById(followeeId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", followeeId));

        if (target.isDeactivated()) {
            throw new ResourceNotFoundException("User", "id", followeeId);
        }

        socialGraph.follow(followerId, followeeId);

        return socialGraph.getProfileSocial(followeeId, followerId);
    }
}
