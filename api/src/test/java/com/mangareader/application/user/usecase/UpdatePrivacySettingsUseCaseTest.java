package com.mangareader.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
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
import com.mangareader.application.user.port.ViewHistoryRepositoryPort;
import com.mangareader.application.user.usecase.UpdatePrivacySettingsUseCase.PrivacyInput;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.valueobject.VisibilitySetting;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("UpdatePrivacySettingsUseCase")
class UpdatePrivacySettingsUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private ViewHistoryRepositoryPort viewHistoryRepository;

    @InjectMocks
    private UpdatePrivacySettingsUseCase updatePrivacySettingsUseCase;

    private final UUID USER_ID = UUID.randomUUID();

    private User buildUser() {
        return User.builder()
                .id(USER_ID)
                .name("Ruan Silva")
                .email("ruan@email.com")
                .passwordHash("hash")
                .commentVisibility(VisibilitySetting.PUBLIC)
                .viewHistoryVisibility(VisibilitySetting.PUBLIC)
                .build();
    }

    @Nested
    @DisplayName("Atualização de configurações")
    class Atualizacao {

        @Test
        @DisplayName("Deve atualizar visibilidade de comentários e histórico")
        void deveAtualizarVisibilidades() {
            User user = buildUser();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            var input = new PrivacyInput(USER_ID, VisibilitySetting.PRIVATE, VisibilitySetting.PRIVATE);
            User result = updatePrivacySettingsUseCase.execute(input);

            assertThat(result.getCommentVisibility()).isEqualTo(VisibilitySetting.PRIVATE);
            assertThat(result.getViewHistoryVisibility()).isEqualTo(VisibilitySetting.PRIVATE);
            verify(userRepository).save(user);
        }

        @Test
        @DisplayName("Deve manter configuração quando campo é null no input")
        void deveManterConfiguracaoQuandoNull() {
            User user = buildUser();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            var input = new PrivacyInput(USER_ID, null, null);
            User result = updatePrivacySettingsUseCase.execute(input);

            assertThat(result.getCommentVisibility()).isEqualTo(VisibilitySetting.PUBLIC);
            assertThat(result.getViewHistoryVisibility()).isEqualTo(VisibilitySetting.PUBLIC);
        }
    }

    @Nested
    @DisplayName("DO_NOT_TRACK deleta histórico")
    class DoNotTrackDeletaHistorico {

        @Test
        @DisplayName("Deve deletar todo o histórico quando viewHistoryVisibility muda para DO_NOT_TRACK")
        void deveDeletarHistoricoQuandoDoNotTrack() {
            User user = buildUser();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            var input = new PrivacyInput(USER_ID, null, VisibilitySetting.DO_NOT_TRACK);
            updatePrivacySettingsUseCase.execute(input);

            verify(viewHistoryRepository).deleteAllByUserId(USER_ID.toString());
        }

        @Test
        @DisplayName("Não deve deletar histórico quando visibilidade muda para PRIVATE")
        void naoDeveDeletarQuandoPrivate() {
            User user = buildUser();
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

            var input = new PrivacyInput(USER_ID, null, VisibilitySetting.PRIVATE);
            updatePrivacySettingsUseCase.execute(input);

            verify(viewHistoryRepository, never()).deleteAllByUserId(any());
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existe")
        void deveLancarExcecaoQuandoUsuarioNaoExiste() {
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

            var input = new PrivacyInput(USER_ID, VisibilitySetting.PRIVATE, null);

            assertThatThrownBy(() -> updatePrivacySettingsUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }
}
