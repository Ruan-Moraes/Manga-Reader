package com.mangareader.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
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

import com.mangareader.application.manga.service.GenreValidator;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.ResourceNotFoundException;
import com.mangareader.mock.user.UserMock;

@ExtendWith(MockitoExtension.class)
@DisplayName("UpdateFavoriteGenresUseCase")
class UpdateFavoriteGenresUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private GenreValidator genreValidator;

    @InjectMocks
    private UpdateFavoriteGenresUseCase useCase;

    @Test
    @DisplayName("Deve validar e atualizar os gêneros favoritos")
    void deveAtualizar() {
        UUID userId = UUID.randomUUID();
        User user = UserMock.withId(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = useCase.execute(userId, List.of(" acao ", "aventura", "acao"));

        assertThat(result.getFavoriteGenres()).containsExactly("acao", "aventura");
        verify(genreValidator).validate(eq(List.of("acao", "aventura")));
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existe")
    void deveLancarQuandoUsuarioNaoExiste() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(userId, List.of("acao")))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Deve propagar erro do GenreValidator para gênero inexistente")
    void deveRejeitarGeneroInvalido() {
        UUID userId = UUID.randomUUID();
        User user = UserMock.withId(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        doThrow(new IllegalArgumentException("Gênero(s) inválido(s): nope")).when(genreValidator).validate(anyList());

        assertThatThrownBy(() -> useCase.execute(userId, List.of("nope")))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
