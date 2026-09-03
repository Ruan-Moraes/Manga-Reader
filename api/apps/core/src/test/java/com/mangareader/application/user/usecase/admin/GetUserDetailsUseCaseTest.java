package com.mangareader.application.user.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

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

@ExtendWith(MockitoExtension.class)
@DisplayName("GetUserDetailsUseCase")
class GetUserDetailsUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private GetUserDetailsUseCase getUserDetailsUseCase;

    private final UUID USER_ID = UUID.randomUUID();

    @Test
    @DisplayName("Deve retornar detalhes do usuário quando existe")
    void deveRetornarDetalhes() {
        User user = User.builder()
                .id(USER_ID)
                .name("Ruan")
                .email("ruan@test.com")
                .passwordHash("hash")
                .build();
        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

        User result = getUserDetailsUseCase.execute(USER_ID);

        assertThat(result.getName()).isEqualTo("Ruan");
        assertThat(result.getEmail()).isEqualTo("ruan@test.com");
    }

    @Test
    @DisplayName("Deve lançar exceção quando usuário não existe")
    void deveLancarExcecaoQuandoNaoExiste() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> getUserDetailsUseCase.execute(USER_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User");
    }
}
