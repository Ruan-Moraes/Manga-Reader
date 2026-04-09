package com.mangareader.application.user.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
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
@DisplayName("UnbanUserUseCase")
class UnbanUserUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private UnbanUserUseCase unbanUserUseCase;

    private final UUID TARGET_ID = UUID.randomUUID();

    @Nested
    @DisplayName("Sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve remover ban e limpar todos os campos")
        void deveRemoverBan() {
            User user = User.builder()
                    .id(TARGET_ID)
                    .name("Banned User")
                    .email("banned@test.com")
                    .passwordHash("hash")
                    .role(UserRole.MEMBER)
                    .banned(true)
                    .bannedAt(LocalDateTime.now().minusDays(1))
                    .bannedReason("Spam")
                    .bannedUntil(LocalDateTime.now().plusDays(6))
                    .build();
            when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            User result = unbanUserUseCase.execute(TARGET_ID);

            assertThat(result.isBanned()).isFalse();
            assertThat(result.getBannedAt()).isNull();
            assertThat(result.getBannedReason()).isNull();
            assertThat(result.getBannedUntil()).isNull();
            verify(userRepository).save(user);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar exceção quando usuário não está banido")
        void deveLancarExcecaoQuandoNaoBanido() {
            User user = User.builder()
                    .id(TARGET_ID)
                    .name("Normal User")
                    .email("normal@test.com")
                    .passwordHash("hash")
                    .role(UserRole.MEMBER)
                    .build();
            when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> unbanUserUseCase.execute(TARGET_ID))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("não está banido");
        }

        @Test
        @DisplayName("Deve lançar exceção quando usuário não existe")
        void deveLancarExcecaoQuandoNaoExiste() {
            when(userRepository.findById(TARGET_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> unbanUserUseCase.execute(TARGET_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }
}
