package com.mangareader.application.user.usecase.admin;

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

import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChangeUserRoleUseCase")
class ChangeUserRoleUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private ChangeUserRoleUseCase changeUserRoleUseCase;

    private final UUID ADMIN_ID = UUID.randomUUID();
    private final UUID TARGET_ID = UUID.randomUUID();

    private User buildUser(UUID id, UserRole role) {
        return User.builder()
                .id(id)
                .name("User")
                .email("user@test.com")
                .passwordHash("hash")
                .role(role)
                .build();
    }

    @Nested
    @DisplayName("Sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve alterar role de MEMBER para MODERATOR")
        void deveAlterarRole() {
            User user = buildUser(TARGET_ID, UserRole.MEMBER);
            when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            User result = changeUserRoleUseCase.execute(ADMIN_ID, TARGET_ID, UserRole.MODERATOR);

            assertThat(result.getRole()).isEqualTo(UserRole.MODERATOR);
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("Deve alterar role de MODERATOR para ADMIN")
        void devePromoverParaAdmin() {
            User user = buildUser(TARGET_ID, UserRole.MODERATOR);
            when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            User result = changeUserRoleUseCase.execute(ADMIN_ID, TARGET_ID, UserRole.ADMIN);

            assertThat(result.getRole()).isEqualTo(UserRole.ADMIN);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar exceção ao tentar alterar próprio role")
        void deveLancarExcecaoQuandoAlteraProprio() {
            assertThatThrownBy(() -> changeUserRoleUseCase.execute(ADMIN_ID, ADMIN_ID, UserRole.MEMBER))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("próprio role");
        }

        @Test
        @DisplayName("Deve lançar exceção quando usuário não existe")
        void deveLancarExcecaoQuandoNaoExiste() {
            when(userRepository.findById(TARGET_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> changeUserRoleUseCase.execute(ADMIN_ID, TARGET_ID, UserRole.MODERATOR))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }
}
