package com.mangareader.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.user.port.RecommendationRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserRecommendation;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("AddRecommendationUseCase")
class AddRecommendationUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private RecommendationRepositoryPort recommendationRepository;

    @Mock
    private TitleRepositoryPort titleRepository;

    @InjectMocks
    private AddRecommendationUseCase addRecommendationUseCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String TITLE_ID = "title-abc-123";

    private User buildUser() {
        return User.builder()
                .id(USER_ID)
                .name("Ruan Silva")
                .email("ruan@email.com")
                .passwordHash("hash")
                .build();
    }

    @Nested
    @DisplayName("Sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve adicionar recomendação com sucesso")
        void deveAdicionarRecomendacao() {
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(recommendationRepository.findByUserIdAndTitleId(USER_ID, TITLE_ID)).thenReturn(Optional.empty());
            when(recommendationRepository.countByUserId(USER_ID)).thenReturn(3L);
            when(titleRepository.findById(TITLE_ID)).thenReturn(Optional.of(
                    Title.builder().id(TITLE_ID).name("Solo Leveling").cover("cover.jpg").build()));
            when(recommendationRepository.save(any(UserRecommendation.class))).thenAnswer(inv -> inv.getArgument(0));

            UserRecommendation result = addRecommendationUseCase.execute(USER_ID, TITLE_ID);

            assertThat(result.getTitleId()).isEqualTo(TITLE_ID);
            assertThat(result.getTitleName()).isEqualTo("Solo Leveling");
            assertThat(result.getTitleCover()).isEqualTo("cover.jpg");
            assertThat(result.getPosition()).isEqualTo(3);
            verify(recommendationRepository).save(any(UserRecommendation.class));
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar exceção quando título já está nas recomendações")
        void deveLancarExcecaoQuandoDuplicado() {
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(recommendationRepository.findByUserIdAndTitleId(USER_ID, TITLE_ID))
                    .thenReturn(Optional.of(UserRecommendation.builder().titleId(TITLE_ID).build()));

            assertThatThrownBy(() -> addRecommendationUseCase.execute(USER_ID, TITLE_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("já está nas recomendações");
        }

        @Test
        @DisplayName("Deve lançar exceção quando limite de 10 recomendações é atingido")
        void deveLancarExcecaoQuandoLimiteAtingido() {
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(recommendationRepository.findByUserIdAndTitleId(USER_ID, TITLE_ID)).thenReturn(Optional.empty());
            when(recommendationRepository.countByUserId(USER_ID)).thenReturn(10L);

            assertThatThrownBy(() -> addRecommendationUseCase.execute(USER_ID, TITLE_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("10");
        }

        @Test
        @DisplayName("Deve lançar exceção quando título não existe")
        void deveLancarExcecaoQuandoTituloNaoExiste() {
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(recommendationRepository.findByUserIdAndTitleId(USER_ID, TITLE_ID)).thenReturn(Optional.empty());
            when(recommendationRepository.countByUserId(USER_ID)).thenReturn(0L);
            when(titleRepository.findById(TITLE_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> addRecommendationUseCase.execute(USER_ID, TITLE_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Title");
        }

        @Test
        @DisplayName("Deve lançar exceção quando usuário não existe")
        void deveLancarExcecaoQuandoUsuarioNaoExiste() {
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> addRecommendationUseCase.execute(USER_ID, TITLE_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }
}
