package com.mangareader.application.forum.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
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

import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.application.forum.usecase.CreateForumTopicUseCase.CreateTopicInput;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.application.i18n.LocaleResolutionService;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("CreateForumTopicUseCase")
class CreateForumTopicUseCaseTest {

    @Mock
    private ForumRepositoryPort forumRepository;

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private LocaleResolutionService localeResolver;

    @InjectMocks
    private CreateForumTopicUseCase createForumTopicUseCase;

    private final UUID USER_ID = UUID.randomUUID();

    private User buildUser() {
        return User.builder()
                .id(USER_ID)
                .name("Ruan Silva")
                .email("ruan@email.com")
                .passwordHash("hash")
                .photoUrl("https://example.com/photo.jpg")
                .build();
    }

    @Nested
    @DisplayName("Criação com sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve criar tópico com autor em snapshot, título, conteúdo, categoria e tags")
        void deveCriarTopicoCompleto() {
            var input = new CreateTopicInput(USER_ID, "Melhor mangá de 2026?",
                    "Qual vocês acham o melhor?", ForumCategory.GERAL, List.of("discussão", "2026"));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(forumRepository.save(any(ForumTopic.class))).thenAnswer(inv -> inv.getArgument(0));

            ForumTopic result = createForumTopicUseCase.execute(input);

            assertThat(result.getAuthorId()).isEqualTo(USER_ID.toString());
            assertThat(result.getAuthorName()).isEqualTo("Ruan Silva");
            assertThat(result.getAuthorPhoto()).isEqualTo("https://example.com/photo.jpg");
            assertThat(result.getTitle()).isEqualTo("Melhor mangá de 2026?");
            assertThat(result.getContent()).isEqualTo("Qual vocês acham o melhor?");
            assertThat(result.getCategory()).isEqualTo(ForumCategory.GERAL);
            assertThat(result.getTags()).containsExactly("discussão", "2026");
        }

        @Test
        @DisplayName("Deve usar lista vazia quando tags é null")
        void deveUsarListaVaziaQuandoTagsNull() {
            var input = new CreateTopicInput(USER_ID, "Sem tags", "Conteúdo", ForumCategory.SUPORTE, null);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(forumRepository.save(any(ForumTopic.class))).thenAnswer(inv -> inv.getArgument(0));

            ForumTopic result = createForumTopicUseCase.execute(input);

            assertThat(result.getTags()).isEmpty();
        }

        @Test
        @DisplayName("Deve persistir o tópico via repositório")
        void devePersistirTopico() {
            var input = new CreateTopicInput(USER_ID, "Título", "Conteúdo", ForumCategory.GERAL, null);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(forumRepository.save(any(ForumTopic.class))).thenAnswer(inv -> inv.getArgument(0));

            createForumTopicUseCase.execute(input);

            ArgumentCaptor<ForumTopic> captor = ArgumentCaptor.forClass(ForumTopic.class);
            verify(forumRepository).save(captor.capture());
            assertThat(captor.getValue().getTitle()).isEqualTo("Título");
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando autor não existe")
        void deveLancarExcecaoQuandoAutorNaoExiste() {
            var input = new CreateTopicInput(USER_ID, "Título", "Conteúdo", ForumCategory.GERAL, null);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> createForumTopicUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }
}
