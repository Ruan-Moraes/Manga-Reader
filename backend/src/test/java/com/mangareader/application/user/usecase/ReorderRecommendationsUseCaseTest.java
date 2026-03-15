package com.mangareader.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.user.port.RecommendationRepositoryPort;
import com.mangareader.domain.user.entity.UserRecommendation;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReorderRecommendationsUseCase")
class ReorderRecommendationsUseCaseTest {

    @Mock
    private RecommendationRepositoryPort recommendationRepository;

    @InjectMocks
    private ReorderRecommendationsUseCase reorderRecommendationsUseCase;

    private final UUID USER_ID = UUID.randomUUID();

    @Test
    @DisplayName("Deve reordenar recomendações atualizando posições")
    void deveReordenarRecomendacoes() {
        UserRecommendation rec1 = UserRecommendation.builder()
                .titleId("title-1").titleName("One Piece").position(0).build();
        UserRecommendation rec2 = UserRecommendation.builder()
                .titleId("title-2").titleName("Naruto").position(1).build();
        UserRecommendation rec3 = UserRecommendation.builder()
                .titleId("title-3").titleName("Bleach").position(2).build();

        // Nova ordem: title-3, title-1, title-2
        List<String> newOrder = List.of("title-3", "title-1", "title-2");

        when(recommendationRepository.findByUserIdAndTitleId(USER_ID, "title-3")).thenReturn(Optional.of(rec3));
        when(recommendationRepository.findByUserIdAndTitleId(USER_ID, "title-1")).thenReturn(Optional.of(rec1));
        when(recommendationRepository.findByUserIdAndTitleId(USER_ID, "title-2")).thenReturn(Optional.of(rec2));
        when(recommendationRepository.save(any(UserRecommendation.class))).thenAnswer(inv -> inv.getArgument(0));

        // Resultado final ordenado
        when(recommendationRepository.findByUserIdOrderByPosition(USER_ID))
                .thenReturn(List.of(rec3, rec1, rec2));

        List<UserRecommendation> result = reorderRecommendationsUseCase.execute(USER_ID, newOrder);

        assertThat(result).hasSize(3);
        assertThat(rec3.getPosition()).isEqualTo(0);
        assertThat(rec1.getPosition()).isEqualTo(1);
        assertThat(rec2.getPosition()).isEqualTo(2);
        verify(recommendationRepository, times(3)).save(any(UserRecommendation.class));
    }

    @Test
    @DisplayName("Deve ignorar títulos não encontrados durante reordenação")
    void deveIgnorarTitulosNaoEncontrados() {
        UserRecommendation rec1 = UserRecommendation.builder()
                .titleId("title-1").titleName("One Piece").position(0).build();

        List<String> newOrder = List.of("title-1", "title-unknown");

        when(recommendationRepository.findByUserIdAndTitleId(USER_ID, "title-1")).thenReturn(Optional.of(rec1));
        when(recommendationRepository.findByUserIdAndTitleId(USER_ID, "title-unknown")).thenReturn(Optional.empty());
        when(recommendationRepository.save(any(UserRecommendation.class))).thenAnswer(inv -> inv.getArgument(0));
        when(recommendationRepository.findByUserIdOrderByPosition(USER_ID)).thenReturn(List.of(rec1));

        List<UserRecommendation> result = reorderRecommendationsUseCase.execute(USER_ID, newOrder);

        assertThat(result).hasSize(1);
        verify(recommendationRepository, times(1)).save(any(UserRecommendation.class));
    }
}
