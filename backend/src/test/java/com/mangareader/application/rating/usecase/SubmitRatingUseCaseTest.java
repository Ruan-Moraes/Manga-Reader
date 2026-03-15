package com.mangareader.application.rating.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.rating.port.RatingRepositoryPort;
import com.mangareader.application.rating.usecase.SubmitRatingUseCase.SubmitRatingInput;
import com.mangareader.application.shared.event.RatingEvent;
import com.mangareader.application.shared.port.EventPublisherPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("SubmitRatingUseCase")
class SubmitRatingUseCaseTest {

    @Mock
    private RatingRepositoryPort ratingRepository;

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private TitleRepositoryPort titleRepository;

    @Mock
    private EventPublisherPort eventPublisher;

    @InjectMocks
    private SubmitRatingUseCase submitRatingUseCase;

    private final UUID USER_ID = UUID.randomUUID();
    private final String TITLE_ID = "title-abc-123";
    private final String TITLE_NAME = "Solo Leveling";
    private final String USER_NAME = "Ruan Silva";

    private User buildUser() {
        return User.builder()
                .id(USER_ID)
                .name(USER_NAME)
                .email("ruan@email.com")
                .passwordHash("hash")
                .build();
    }

    @Nested
    @DisplayName("Nova avaliação (create)")
    class NovaAvaliacao {

        @Test
        @DisplayName("Deve criar avaliação quando usuário nunca avaliou o título")
        void deveCriarAvaliacaoQuandoUsuarioNuncaAvaliou() {
            // Arrange
            var input = new SubmitRatingInput(TITLE_ID, USER_ID, 4.0, 5.0, 3.5, 4.0, 3.0, 4.5, "Ótimo mangá!");
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(ratingRepository.findByTitleIdAndUserId(TITLE_ID, USER_ID.toString())).thenReturn(Optional.empty());
            when(titleRepository.findById(TITLE_ID)).thenReturn(Optional.of(Title.builder().id(TITLE_ID).name(TITLE_NAME).build()));
            when(ratingRepository.save(any(MangaRating.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            MangaRating result = submitRatingUseCase.execute(input);

            // Assert
            assertThat(result.getTitleId()).isEqualTo(TITLE_ID);
            assertThat(result.getUserId()).isEqualTo(USER_ID.toString());
            assertThat(result.getUserName()).isEqualTo(USER_NAME);
            assertThat(result.getTitleName()).isEqualTo(TITLE_NAME);
            assertThat(result.getFunRating()).isEqualTo(4.0);
            assertThat(result.getArtRating()).isEqualTo(5.0);
            assertThat(result.getStorylineRating()).isEqualTo(3.5);
            assertThat(result.getCharactersRating()).isEqualTo(4.0);
            assertThat(result.getOriginalityRating()).isEqualTo(3.0);
            assertThat(result.getPacingRating()).isEqualTo(4.5);
            assertThat(result.getOverallRating()).isEqualTo(4.0); // (4+5+3.5+4+3+4.5)/6 = 4.0
            assertThat(result.getComment()).isEqualTo("Ótimo mangá!");
        }

        @Test
        @DisplayName("Deve preencher userName a partir do User encontrado")
        void devePreencherUserNameDoUsuario() {
            // Arrange
            var input = new SubmitRatingInput(TITLE_ID, USER_ID, 3.0, 3.0, 3.0, 3.0, 3.0, 3.0, null);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(ratingRepository.findByTitleIdAndUserId(TITLE_ID, USER_ID.toString())).thenReturn(Optional.empty());
            when(titleRepository.findById(TITLE_ID)).thenReturn(Optional.of(Title.builder().id(TITLE_ID).name(TITLE_NAME).build()));
            when(ratingRepository.save(any(MangaRating.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            MangaRating result = submitRatingUseCase.execute(input);

            // Assert
            assertThat(result.getUserName()).isEqualTo(USER_NAME);
        }

        @Test
        @DisplayName("Deve publicar evento 'rating.submitted' após salvar")
        void devePublicarEventoAposSalvar() {
            // Arrange
            var input = new SubmitRatingInput(TITLE_ID, USER_ID, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, "Bom");
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(ratingRepository.findByTitleIdAndUserId(TITLE_ID, USER_ID.toString())).thenReturn(Optional.empty());
            when(titleRepository.findById(TITLE_ID)).thenReturn(Optional.of(Title.builder().id(TITLE_ID).name(TITLE_NAME).build()));
            when(ratingRepository.save(any(MangaRating.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            submitRatingUseCase.execute(input);

            // Assert
            ArgumentCaptor<RatingEvent> eventCaptor = ArgumentCaptor.forClass(RatingEvent.class);
            verify(eventPublisher).publish(eq("rating.submitted"), eventCaptor.capture());
            assertThat(eventCaptor.getValue().titleId()).isEqualTo(TITLE_ID);
            assertThat(eventCaptor.getValue().userId()).isEqualTo(USER_ID.toString());
        }
    }

    @Nested
    @DisplayName("Upsert (atualização de avaliação existente)")
    class Upsert {

        @Test
        @DisplayName("Deve atualizar avaliação existente em vez de criar nova")
        void deveAtualizarAvaliacaoExistente() {
            // Arrange
            MangaRating existing = MangaRating.builder()
                    .id("rating-existing-id")
                    .titleId(TITLE_ID)
                    .userId(USER_ID.toString())
                    .userName("Nome Antigo")
                    .funRating(2.0)
                    .artRating(2.0)
                    .storylineRating(2.0)
                    .charactersRating(2.0)
                    .originalityRating(2.0)
                    .pacingRating(2.0)
                    .overallRating(2.0)
                    .comment("Comentário antigo")
                    .build();

            var input = new SubmitRatingInput(TITLE_ID, USER_ID, 5.0, 5.0, 4.0, 4.5, 3.5, 4.0, "Agora está ótimo!");
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(ratingRepository.findByTitleIdAndUserId(TITLE_ID, USER_ID.toString())).thenReturn(Optional.of(existing));
            when(titleRepository.findById(TITLE_ID)).thenReturn(Optional.of(Title.builder().id(TITLE_ID).name(TITLE_NAME).build()));
            when(ratingRepository.save(any(MangaRating.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            MangaRating result = submitRatingUseCase.execute(input);

            // Assert
            assertThat(result.getId()).isEqualTo("rating-existing-id");
            assertThat(result.getFunRating()).isEqualTo(5.0);
            assertThat(result.getArtRating()).isEqualTo(5.0);
            assertThat(result.getComment()).isEqualTo("Agora está ótimo!");
            assertThat(result.getUserName()).isEqualTo(USER_NAME);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existe")
        void deveLancarExcecaoQuandoUsuarioNaoExiste() {
            // Arrange
            var input = new SubmitRatingInput(TITLE_ID, USER_ID, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, "Bom");
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> submitRatingUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }
}
