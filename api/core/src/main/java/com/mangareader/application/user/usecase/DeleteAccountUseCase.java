package com.mangareader.application.user.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.auth.port.RefreshTokenRepositoryPort;
import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.application.social.port.SocialGraphPort;
import com.mangareader.application.user.port.ReadingProgressRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Exclui (desativa + anonimiza) a conta do usuário autenticado.
 * <p>
 * Remove vínculos com grupos, apaga o histórico de leitura (MongoDB), remove o
 * nó do grafo social (Neo4j — DT-48) e anonimiza os dados pessoais no
 * PostgreSQL. Irreversível.
 */
@Service
@RequiredArgsConstructor
public class DeleteAccountUseCase {
    private final UserRepositoryPort userRepository;
    private final ClearTrackedHistoryUseCase clearTrackedHistoryUseCase;
    private final ReadingProgressRepositoryPort readingProgressRepository;
    private final GroupRepositoryPort groupRepository;
    private final SocialGraphPort socialGraph;
    private final RefreshTokenRepositoryPort refreshTokens;

    @Transactional
    public void execute(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        for (Group group : groupRepository.findGroupsByMemberUserId(userId)) {
            group.getGroupUsers().removeIf(gu -> gu.getUser().getId().equals(userId));
            groupRepository.save(group);
        }

        clearTrackedHistoryUseCase.execute(userId.toString());
        readingProgressRepository.deleteAllByUserId(userId.toString());

        // Grafo ANTES do save JPA: se o Cypher falhar, a tx JPA aborta.
        // Não-atômico cross-DB — nó órfão residual é inerte (só userId) e as
        // listas filtram desativados na hidratação (ver docs/tech-debt.md DT-48).
        socialGraph.removeUser(userId);

        user.deactivate();
        userRepository.save(user);
        refreshTokens.revokeAllForUser(userId);
    }
}
