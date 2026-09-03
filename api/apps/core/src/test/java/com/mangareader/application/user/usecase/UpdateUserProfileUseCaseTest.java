package com.mangareader.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.shared.event.UserProfileUpdatedEvent;
import com.mangareader.application.shared.port.EventPublisherPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.service.UsernameValidator;
import com.mangareader.application.user.usecase.UpdateUserProfileUseCase.SocialLinkInput;
import com.mangareader.application.user.usecase.UpdateUserProfileUseCase.UpdateProfileInput;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserSocialLink;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("UpdateUserProfileUseCase")
class UpdateUserProfileUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    // Validador real (sem dependências) — exercita formato/reservados de verdade.
    @org.mockito.Spy
    private UsernameValidator usernameValidator = new UsernameValidator();

    @Mock
    private EventPublisherPort eventPublisher;

    @InjectMocks
    private UpdateUserProfileUseCase updateUserProfileUseCase;

    @Captor
    private ArgumentCaptor<User> userCaptor;

    @Captor
    private ArgumentCaptor<UserProfileUpdatedEvent> eventCaptor;

    private final UUID USER_ID = UUID.randomUUID();

    private User buildUser() {
        return User.builder()
                .id(USER_ID)
                .name("Nome Original")
                .email("user@email.com")
                .passwordHash("hash")
                .bio("Bio original")
                .photoUrl("https://example.com/old.jpg")
                .socialLinks(new ArrayList<>())
                .build();
    }

    @Nested
    @DisplayName("Username (DT-48)")
    class Username {

        @Test
        @DisplayName("Deve normalizar (trim + lowercase), validar e salvar username disponível")
        void deveClaimarUsernameDisponivel() {
            User user = buildUser();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(userRepository.existsByUsernameIgnoreCase("leitor_br")).thenReturn(false);
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            var input = new UpdateProfileInput(USER_ID, null, "  Leitor_BR ", null, null, null, null);
            User result = updateUserProfileUseCase.execute(input);

            assertThat(result.getUsername()).isEqualTo("leitor_br");
        }

        @Test
        @DisplayName("Deve lançar 409 quando username já está em uso por outro usuário")
        void deveLancar409QuandoDuplicado() {
            User user = buildUser();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(userRepository.existsByUsernameIgnoreCase("ocupado")).thenReturn(true);

            var input = new UpdateProfileInput(USER_ID, null, "ocupado", null, null, null, null);

            assertThatThrownBy(() -> updateUserProfileUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("em uso");
        }

        @Test
        @DisplayName("Re-enviar o próprio username não checa unicidade nem falha")
        void reenvioDoProprioUsernameEIdempotente() {
            User user = buildUser();
            user.setUsername("leitor_br");
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            var input = new UpdateProfileInput(USER_ID, null, "LEITOR_BR", null, null, null, null);
            User result = updateUserProfileUseCase.execute(input);

            assertThat(result.getUsername()).isEqualTo("leitor_br");
            verify(userRepository, org.mockito.Mockito.never()).existsByUsernameIgnoreCase(any());
        }

        @Test
        @DisplayName("Deve rejeitar formato inválido (400)")
        void deveRejeitarFormatoInvalido() {
            User user = buildUser();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

            var input = new UpdateProfileInput(USER_ID, null, "ab", null, null, null, null);

            assertThatThrownBy(() -> updateUserProfileUseCase.execute(input))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Deve rejeitar username reservado (400)")
        void deveRejeitarReservado() {
            User user = buildUser();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

            var input = new UpdateProfileInput(USER_ID, null, "admin", null, null, null, null);

            assertThatThrownBy(() -> updateUserProfileUseCase.execute(input))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("reservado");
        }
    }

    @Nested
    @DisplayName("Atualização parcial (PATCH)")
    class AtualizacaoParcial {

        @Test
        @DisplayName("Deve atualizar apenas o nome quando outros campos são null")
        void deveAtualizarApenasNome() {
            // Arrange
            User user = buildUser();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateProfileInput input = new UpdateProfileInput(USER_ID, "Novo Nome", null, null, null, null, null);

            // Act
            User result = updateUserProfileUseCase.execute(input);

            // Assert
            assertThat(result.getName()).isEqualTo("Novo Nome");
            assertThat(result.getBio()).isEqualTo("Bio original");
            assertThat(result.getPhotoUrl()).isEqualTo("https://example.com/old.jpg");
        }

        @Test
        @DisplayName("Deve atualizar apenas a bio quando outros campos são null")
        void deveAtualizarApenasBio() {
            // Arrange
            User user = buildUser();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateProfileInput input = new UpdateProfileInput(USER_ID, null, null, "Nova bio", null, null, null);

            // Act
            User result = updateUserProfileUseCase.execute(input);

            // Assert
            assertThat(result.getName()).isEqualTo("Nome Original");
            assertThat(result.getBio()).isEqualTo("Nova bio");
        }

        @Test
        @DisplayName("Deve atualizar todos os campos quando fornecidos")
        void deveAtualizarTodosCampos() {
            // Arrange
            User user = buildUser();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            List<SocialLinkInput> links = List.of(
                    new SocialLinkInput("twitter", "https://twitter.com/user"),
                    new SocialLinkInput("github", "https://github.com/user")
            );
            UpdateProfileInput input = new UpdateProfileInput(
                    USER_ID, "Novo Nome", null, "Nova bio", "https://example.com/new.jpg", null, links);

            // Act
            User result = updateUserProfileUseCase.execute(input);

            // Assert
            assertThat(result.getName()).isEqualTo("Novo Nome");
            assertThat(result.getBio()).isEqualTo("Nova bio");
            assertThat(result.getPhotoUrl()).isEqualTo("https://example.com/new.jpg");
            assertThat(result.getSocialLinks()).hasSize(2);
            assertThat(result.getSocialLinks().get(0).getPlatform()).isEqualTo("twitter");
            assertThat(result.getSocialLinks().get(1).getPlatform()).isEqualTo("github");
        }
    }

    @Nested
    @DisplayName("Social Links com orphanRemoval")
    class SocialLinks {

        @Test
        @DisplayName("Deve limpar links antigos e adicionar novos via orphanRemoval")
        void deveLimparLinksAntigosEAdicionarNovos() {
            // Arrange
            User user = buildUser();
            UserSocialLink oldLink = UserSocialLink.builder()
                    .user(user)
                    .platform("facebook")
                    .url("https://facebook.com/old")
                    .build();
            user.getSocialLinks().add(oldLink);

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            List<SocialLinkInput> newLinks = List.of(
                    new SocialLinkInput("instagram", "https://instagram.com/user")
            );
            UpdateProfileInput input = new UpdateProfileInput(USER_ID, null, null, null, null, null, newLinks);

            // Act
            User result = updateUserProfileUseCase.execute(input);

            // Assert
            assertThat(result.getSocialLinks()).hasSize(1);
            assertThat(result.getSocialLinks().get(0).getPlatform()).isEqualTo("instagram");
            assertThat(result.getSocialLinks().get(0).getUser()).isEqualTo(user);
        }

        @Test
        @DisplayName("Não deve alterar links quando socialLinks é null no input")
        void naoDeveAlterarLinksQuandoNull() {
            // Arrange
            User user = buildUser();
            UserSocialLink existingLink = UserSocialLink.builder()
                    .user(user)
                    .platform("twitter")
                    .url("https://twitter.com/user")
                    .build();
            user.getSocialLinks().add(existingLink);

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateProfileInput input = new UpdateProfileInput(USER_ID, "Novo Nome", null, null, null, null, null);

            // Act
            User result = updateUserProfileUseCase.execute(input);

            // Assert
            assertThat(result.getSocialLinks()).hasSize(1);
            assertThat(result.getSocialLinks().get(0).getPlatform()).isEqualTo("twitter");
        }
    }

    @Nested
    @DisplayName("Evento de atualização")
    class Evento {

        @Test
        @DisplayName("Deve publicar evento user.profile.updated após salvar")
        void devePublicarEventoAposSalvar() {
            // Arrange
            User user = buildUser();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateProfileInput input = new UpdateProfileInput(
                    USER_ID, "Nome Atualizado", null, null, "https://example.com/new.jpg", null, null);

            // Act
            updateUserProfileUseCase.execute(input);

            // Assert
            verify(eventPublisher).publish(eq("user.profile.updated"), eventCaptor.capture());
            UserProfileUpdatedEvent event = eventCaptor.getValue();
            assertThat(event.userId()).isEqualTo(USER_ID.toString());
            assertThat(event.newName()).isEqualTo("Nome Atualizado");
            assertThat(event.newPhotoUrl()).isEqualTo("https://example.com/new.jpg");
        }

        @Test
        @DisplayName("Deve persistir antes de publicar evento")
        void devePersistirAntesDePublicarEvento() {
            // Arrange
            User user = buildUser();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateProfileInput input = new UpdateProfileInput(USER_ID, "Novo", null, null, null, null, null);

            // Act
            updateUserProfileUseCase.execute(input);

            // Assert
            var inOrder = org.mockito.Mockito.inOrder(userRepository, eventPublisher);
            inOrder.verify(userRepository).save(any(User.class));
            inOrder.verify(eventPublisher).publish(eq("user.profile.updated"), any(UserProfileUpdatedEvent.class));
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existe")
        void deveLancarExcecaoQuandoUsuarioNaoExiste() {
            // Arrange
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

            UpdateProfileInput input = new UpdateProfileInput(USER_ID, "Nome", null, null, null, null, null);

            // Act & Assert
            assertThatThrownBy(() -> updateUserProfileUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
