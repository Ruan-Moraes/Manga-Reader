package com.mangareader.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.ResourceNotFoundException;
import com.mangareader.mock.user.UserMock;

@ExtendWith(MockitoExtension.class)
@DisplayName("UpdateLanguagePreferencesUseCase")
class UpdateLanguagePreferencesUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private UpdateLanguagePreferencesUseCase useCase;

    @Test
    @DisplayName("Deve atualizar contentLocales do usuário")
    void deveAtualizarPreferencias() {
        UUID userId = UUID.randomUUID();
        User user = UserMock.withId(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = useCase.execute(userId, List.of("en-US", "pt-BR"));

        assertThat(result.getContentLocales()).containsExactly("en-US", "pt-BR");
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existe")
    void deveLancarQuandoUsuarioNaoExiste() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(userId, List.of("pt-BR")))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Deve propagar IllegalArgumentException para tag inválida")
    void deveRejeitarTagInvalida() {
        UUID userId = UUID.randomUUID();
        User user = UserMock.withId(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> useCase.execute(userId, List.of("not_a_locale!!!")))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
