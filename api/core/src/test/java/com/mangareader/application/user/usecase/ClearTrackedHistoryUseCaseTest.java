package com.mangareader.application.user.usecase;

import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.user.port.ActivityEventRepositoryPort;
import com.mangareader.application.user.port.UserChapterReadRepositoryPort;
import com.mangareader.application.user.port.ViewHistoryRepositoryPort;
import com.mangareader.application.analytics.port.BehaviorEventRepositoryPort;

@ExtendWith(MockitoExtension.class)
@DisplayName("ClearTrackedHistoryUseCase")
class ClearTrackedHistoryUseCaseTest {

    @Mock
    private ViewHistoryRepositoryPort viewHistoryRepository;

    @Mock
    private UserChapterReadRepositoryPort userChapterReadRepository;

    @Mock
    private ActivityEventRepositoryPort activityEventRepository;

    @Mock
    private BehaviorEventRepositoryPort behaviorEventRepository;

    @InjectMocks
    private ClearTrackedHistoryUseCase useCase;

    @Test
    @DisplayName("Deve remover todas as projeções do histórico unificado")
    void deveRemoverHistoricoUnificado() {
        useCase.execute("user-1");

        verify(viewHistoryRepository).deleteAllByUserId("user-1");
        verify(userChapterReadRepository).deleteAllByUserId("user-1");
        verify(activityEventRepository).deleteAllByUserId("user-1");
        verify(behaviorEventRepository).deleteAllByUserId("user-1");
    }
}
