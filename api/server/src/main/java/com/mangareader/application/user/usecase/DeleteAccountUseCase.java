package com.mangareader.application.user.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.port.ViewHistoryRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Exclui (desativa + anonimiza) a conta do usuário autenticado.
 * <p>
 * Remove vínculos com grupos, apaga o histórico de leitura (MongoDB) e
 * anonimiza os dados pessoais no PostgreSQL. Irreversível.
 */
@Service
@RequiredArgsConstructor
public class DeleteAccountUseCase {
    private final UserRepositoryPort userRepository;
    private final ViewHistoryRepositoryPort viewHistoryRepository;
    private final GroupRepositoryPort groupRepository;

    @Transactional
    public void execute(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        for (Group group : groupRepository.findGroupsByMemberUserId(userId)) {
            group.getGroupUsers().removeIf(gu -> gu.getUser().getId().equals(userId));
            groupRepository.save(group);
        }

        viewHistoryRepository.deleteAllByUserId(userId.toString());

        user.deactivate();
        userRepository.save(user);
    }
}
