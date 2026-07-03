package com.mangareader.application.social.usecase;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.social.model.UserSummary;
import com.mangareader.application.social.port.SocialGraphPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;

import lombok.RequiredArgsConstructor;

/**
 * Lista os seguidores de um usuário (DT-48): página de ids do grafo
 * (mais recente primeiro) hidratada em lote do Postgres (sem N+1),
 * preservando a ordem do grafo e filtrando contas desativadas.
 */
@Service
@RequiredArgsConstructor
public class GetFollowersUseCase {
    private final SocialGraphPort socialGraph;
    private final UserRepositoryPort userRepository;

    public Page<UserSummary> execute(UUID userId, Pageable pageable) {
        Page<UUID> ids = socialGraph.listFollowers(userId, pageable);

        return new PageImpl<>(hydrate(ids.getContent(), userRepository), pageable, ids.getTotalElements());
    }

    /** Hidrata ids em lote preservando a ordem do grafo (findAllById não ordena). */
    static List<UserSummary> hydrate(List<UUID> ids, UserRepositoryPort userRepository) {
        if (ids.isEmpty()) {
            return List.of();
        }

        Map<UUID, User> byId = userRepository.findAllById(ids).stream()
                .filter(u -> !u.isDeactivated())
                .collect(java.util.stream.Collectors.toMap(User::getId, Function.identity()));

        return ids.stream()
                .map(byId::get)
                .filter(Objects::nonNull)
                .map(UserSummary::from)
                .toList();
    }
}
