package com.mangareader.application.user.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.user.port.ActivityEventRepositoryPort;
import com.mangareader.application.user.port.UserChapterReadRepositoryPort;
import com.mangareader.application.user.port.ViewHistoryRepositoryPort;
import com.mangareader.application.analytics.port.BehaviorEventRepositoryPort;

import lombok.RequiredArgsConstructor;

/**
 * Remove todas as projeções de histórico rastreado de um usuário no MongoDB.
 *
 * <p>Não remove {@code reading_progress}: ele representa o estado funcional
 * "onde parei", não uma linha do tempo de ações.</p>
 */
@Service
@RequiredArgsConstructor
public class ClearTrackedHistoryUseCase {
    private final ViewHistoryRepositoryPort viewHistoryRepository;
    private final UserChapterReadRepositoryPort userChapterReadRepository;
    private final ActivityEventRepositoryPort activityEventRepository;
    private final BehaviorEventRepositoryPort behaviorEventRepository;

    @Transactional("mongoTransactionManager")
    public void execute(String userId) {
        viewHistoryRepository.deleteAllByUserId(userId);
        userChapterReadRepository.deleteAllByUserId(userId);
        activityEventRepository.deleteAllByUserId(userId);
        behaviorEventRepository.deleteAllByUserId(userId);
    }
}
