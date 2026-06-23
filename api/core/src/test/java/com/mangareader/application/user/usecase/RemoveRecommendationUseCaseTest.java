package com.mangareader.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.user.port.RecommendationRepositoryPort;
import com.mangareader.domain.user.entity.UserRecommendation;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("RemoveRecommendationUseCase")
class RemoveRecommendationUseCaseTest {

    @Mock
    private RecommendationRepositoryPort recommendationRepository;

    @InjectMocks
    private RemoveRecommendationUseCase removeRecommendationUseCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String TITLE_ID = "title-abc-123";

    @Nested
    @DisplayName("Sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve remover recomendação com sucesso")
        void deveRemoverRecomendacao() {
            UserRecommendation rec = UserRecommendation.builder()
                    .titleId(TITLE_ID)
                    .titleName("Solo Leveling")
                    .build();
            when(recommendationRepository.findByUserIdAndTitleId(USER_ID, TITLE_ID))
                    .thenReturn(Optional.of(rec));

            removeRecommendationUseCase.execute(USER_ID, TITLE_ID);

            verify(recommendationRepository).deleteByUserIdAndTitleId(USER_ID, TITLE_ID);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar exceção quando recomendação não existe")
        void deveLancarExcecaoQuandoNaoExiste() {
            when(recommendationRepository.findByUserIdAndTitleId(USER_ID, TITLE_ID))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> removeRecommendationUseCase.execute(USER_ID, TITLE_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Recommendation");
        }
    }
}
