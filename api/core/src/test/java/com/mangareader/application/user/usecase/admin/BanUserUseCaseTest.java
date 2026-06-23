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
@DisplayName("BanUserUseCase")
class BanUserUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private BanUserUseCase banUserUseCase;

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
        @DisplayName("Deve banir usuário com motivo e duração")
        void deveBanirComDuracao() {
            User user = buildUser(TARGET_ID, UserRole.MEMBER);
            LocalDateTime until = LocalDateTime.now().plusDays(7);
            when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            User result = banUserUseCase.execute(TARGET_ID, "Spam", until);

            assertThat(result.isBanned()).isTrue();
            assertThat(result.getBannedReason()).isEqualTo("Spam");
            assertThat(result.getBannedUntil()).isEqualTo(until);
            assertThat(result.getBannedAt()).isNotNull();
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("Deve banir usuário permanentemente quando bannedUntil é null")
        void deveBanirPermanentemente() {
            User user = buildUser(TARGET_ID, UserRole.MEMBER);
            when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            User result = banUserUseCase.execute(TARGET_ID, "Violação grave", null);

            assertThat(result.isBanned()).isTrue();
            assertThat(result.getBannedUntil()).isNull();
        }

        @Test
        @DisplayName("Deve banir MODERATOR com sucesso")
        void deveBanirModerador() {
            User user = buildUser(TARGET_ID, UserRole.MODERATOR);
            when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            User result = banUserUseCase.execute(TARGET_ID, "Abuso de poder", null);

            assertThat(result.isBanned()).isTrue();
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar exceção ao tentar banir ADMIN")
        void deveLancarExcecaoAoBanirAdmin() {
            User admin = buildUser(TARGET_ID, UserRole.ADMIN);
            when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(admin));

            assertThatThrownBy(() -> banUserUseCase.execute(TARGET_ID, "Teste", null))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("administrador");
        }

        @Test
        @DisplayName("Deve lançar exceção quando usuário já está banido")
        void deveLancarExcecaoQuandoJaBanido() {
            User user = buildUser(TARGET_ID, UserRole.MEMBER);
            user.setBanned(true);
            when(userRepository.findById(TARGET_ID)).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> banUserUseCase.execute(TARGET_ID, "Duplo ban", null))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("já está banido");
        }

        @Test
        @DisplayName("Deve lançar exceção quando usuário não existe")
        void deveLancarExcecaoQuandoNaoExiste() {
            when(userRepository.findById(TARGET_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> banUserUseCase.execute(TARGET_ID, "Teste", null))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }
}
