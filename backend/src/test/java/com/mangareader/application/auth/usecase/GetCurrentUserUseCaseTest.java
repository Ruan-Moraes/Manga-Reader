package com.mangareader.application.auth.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetCurrentUserUseCase")
class GetCurrentUserUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private GetCurrentUserUseCase getCurrentUserUseCase;

    private final UUID USER_ID = UUID.randomUUID();

    @Nested
    @DisplayName("Cenário de sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve retornar usuário quando ID existe")
        void deveRetornarUsuarioQuandoIdExiste() {
            // Arrange
            User user = User.builder()
                    .id(USER_ID)
                    .name("Ruan Silva")
                    .email("ruan@email.com")
                    .passwordHash("hash")
                    .role(UserRole.MEMBER)
                    .build();

            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

            // Act
            User result = getCurrentUserUseCase.execute(USER_ID);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(USER_ID);
            assertThat(result.getName()).isEqualTo("Ruan Silva");
            assertThat(result.getEmail()).isEqualTo("ruan@email.com");
            assertThat(result.getRole()).isEqualTo(UserRole.MEMBER);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existe")
        void deveLancarExcecaoQuandoUsuarioNaoExiste() {
            // Arrange
            UUID missingId = UUID.randomUUID();
            when(userRepository.findById(missingId)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> getCurrentUserUseCase.execute(missingId))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User")
                    .hasMessageContaining("id");
        }
    }
}
