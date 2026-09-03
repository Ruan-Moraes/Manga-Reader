package com.mangareader.application.social.usecase;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.social.model.UserSummary;
import com.mangareader.application.social.port.SocialGraphPort;
import com.mangareader.application.user.port.UserRepositoryPort;

import lombok.RequiredArgsConstructor;

/**
 * Lista quem um usuário segue (DT-48) — mesmo pipeline de hidratação de
 * {@link GetFollowersUseCase}.
 */
@Service
@RequiredArgsConstructor
public class GetFollowingUseCase {
    private final SocialGraphPort socialGraph;
    private final UserRepositoryPort userRepository;

    public Page<UserSummary> execute(UUID userId, Pageable pageable) {
        Page<UUID> ids = socialGraph.listFollowing(userId, pageable);

        return new PageImpl<>(GetFollowersUseCase.hydrate(ids.getContent(), userRepository), pageable, ids.getTotalElements());
    }
}
