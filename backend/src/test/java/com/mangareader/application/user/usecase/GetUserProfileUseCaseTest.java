package com.mangareader.application.user.usecase;

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
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetUserProfileUseCase")
class GetUserProfileUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private GetUserProfileUseCase getUserProfileUseCase;

    @Test
    @DisplayName("Deve retornar perfil do usuário quando encontrado")
    void deveRetornarPerfilQuandoEncontrado() {
        // Arrange
        UUID userId = UUID.randomUUID();
        User user = User.builder()
                .id(userId)
                .name("Ruan")
                .email("ruan@email.com")
                .passwordHash("hash")
                .bio("Leitor de mangás")
                .photoUrl("https://example.com/photo.jpg")
                .role(UserRole.MEMBER)
                .build();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        // Act
        User result = getUserProfileUseCase.execute(userId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(userId);
        assertThat(result.getName()).isEqualTo("Ruan");
        assertThat(result.getBio()).isEqualTo("Leitor de mangás");
        assertThat(result.getRole()).isEqualTo(UserRole.MEMBER);
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existe")
    void deveLancarExcecaoQuandoUsuarioNaoExiste() {
        // Arrange
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> getUserProfileUseCase.execute(userId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
