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

import com.mangareader.application.user.port.UserProfileSettingsRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.service.UserProfileSettingsResolver;
import com.mangareader.application.user.usecase.UpdatePrivacySettingsUseCase.PrivacyInput;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserProfileSettings;
import com.mangareader.domain.user.valueobject.AdultContentPreference;
import com.mangareader.domain.user.valueobject.VisibilitySetting;
import com.mangareader.shared.exception.ResourceNotFoundException;
import com.mangareader.application.analytics.usecase.ClearBehaviorHistoryUseCase;

@ExtendWith(MockitoExtension.class)
@DisplayName("UpdatePrivacySettingsUseCase")
class UpdatePrivacySettingsUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private UserProfileSettingsRepositoryPort profileSettingsRepository;

    @Mock
    private UserProfileSettingsResolver profileSettingsResolver;

    @Mock
    private ClearTrackedHistoryUseCase clearTrackedHistoryUseCase;

    @Mock
    private ClearBehaviorHistoryUseCase clearBehaviorHistoryUseCase;

    @InjectMocks
    private UpdatePrivacySettingsUseCase updatePrivacySettingsUseCase;

    private final UUID USER_ID = UUID.randomUUID();

    private User buildUser() {
        return User.builder()
                .id(USER_ID)
                .name("Ruan Silva")
                .email("ruan@email.com")
                .passwordHash("hash")
                .build();
    }

    private UserProfileSettings buildSettings(User user) {
        return UserProfileSettings.defaults(user);
    }

    @Nested
    @DisplayName("Atualização de configurações")
    class Atualizacao {

        @Test
        @DisplayName("Deve atualizar visibilidade de comentários e histórico")
        void deveAtualizarVisibilidades() {
            User user = buildUser();
            UserProfileSettings settings = buildSettings(user);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(profileSettingsResolver.getOrCreate(user)).thenReturn(settings);
            when(profileSettingsRepository.save(any(UserProfileSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            var input = new PrivacyInput(USER_ID, VisibilitySetting.PRIVATE, VisibilitySetting.PRIVATE, null, null);
            UserProfileSettings result = updatePrivacySettingsUseCase.execute(input);

            assertThat(result.getCommentVisibility()).isEqualTo(VisibilitySetting.PRIVATE);
            assertThat(result.getViewHistoryVisibility()).isEqualTo(VisibilitySetting.PRIVATE);
            verify(profileSettingsRepository).save(settings);
        }

        @Test
        @DisplayName("DT-49: deve atualizar visibilidade da biblioteca")
        void deveAtualizarVisibilidadeDaBiblioteca() {
            User user = buildUser();
            UserProfileSettings settings = buildSettings(user);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(profileSettingsResolver.getOrCreate(user)).thenReturn(settings);
            when(profileSettingsRepository.save(any(UserProfileSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            var input = new PrivacyInput(USER_ID, null, null, VisibilitySetting.PRIVATE, null);
            UserProfileSettings result = updatePrivacySettingsUseCase.execute(input);

            assertThat(result.getLibraryVisibility()).isEqualTo(VisibilitySetting.PRIVATE);
            assertThat(result.getCommentVisibility()).isEqualTo(VisibilitySetting.PUBLIC);
        }

        @Test
        @DisplayName("Deve manter configuração quando campo é null no input")
        void deveManterConfiguracaoQuandoNull() {
            User user = buildUser();
            UserProfileSettings settings = buildSettings(user);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(profileSettingsResolver.getOrCreate(user)).thenReturn(settings);
            when(profileSettingsRepository.save(any(UserProfileSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            var input = new PrivacyInput(USER_ID, null, null, null, null);
            UserProfileSettings result = updatePrivacySettingsUseCase.execute(input);

            assertThat(result.getCommentVisibility()).isEqualTo(VisibilitySetting.PUBLIC);
            assertThat(result.getViewHistoryVisibility()).isEqualTo(VisibilitySetting.PUBLIC);
        }

        @Test
        @DisplayName("Deve atualizar preferência de conteúdo adulto")
        void deveAtualizarPreferenciaAdulto() {
            User user = buildUser();
            UserProfileSettings settings = buildSettings(user);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(profileSettingsResolver.getOrCreate(user)).thenReturn(settings);
            when(profileSettingsRepository.save(any(UserProfileSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            var input = new PrivacyInput(USER_ID, null, null, null, AdultContentPreference.HIDE);
            UserProfileSettings result = updatePrivacySettingsUseCase.execute(input);

            assertThat(result.getAdultContentPreference()).isEqualTo(AdultContentPreference.HIDE);
        }
    }

    @Nested
    @DisplayName("DO_NOT_TRACK deleta histórico")
    class DoNotTrackDeletaHistorico {

        @Test
        @DisplayName("Deve apagar analytics ao desativar a preferência")
        void deveApagarAnalyticsAoDesativar() {
            User user = buildUser();
            UserProfileSettings settings = buildSettings(user);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(profileSettingsResolver.getOrCreate(user)).thenReturn(settings);
            when(profileSettingsRepository.save(any(UserProfileSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            updatePrivacySettingsUseCase.execute(new PrivacyInput(USER_ID, null, null, null, null, false));

            verify(clearBehaviorHistoryUseCase).execute(USER_ID.toString());
            assertThat(settings.isBehaviorAnalyticsEnabled()).isFalse();
        }

        @Test
        @DisplayName("Deve deletar todo o histórico quando viewHistoryVisibility muda para DO_NOT_TRACK")
        void deveDeletarHistoricoQuandoDoNotTrack() {
            User user = buildUser();
            UserProfileSettings settings = buildSettings(user);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(profileSettingsResolver.getOrCreate(user)).thenReturn(settings);
            when(profileSettingsRepository.save(any(UserProfileSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            var input = new PrivacyInput(USER_ID, null, VisibilitySetting.DO_NOT_TRACK, null, null);
            updatePrivacySettingsUseCase.execute(input);

            verify(clearTrackedHistoryUseCase).execute(USER_ID.toString());
        }

        @Test
        @DisplayName("Não deve deletar histórico quando visibilidade muda para PRIVATE")
        void naoDeveDeletarQuandoPrivate() {
            User user = buildUser();
            UserProfileSettings settings = buildSettings(user);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(profileSettingsResolver.getOrCreate(user)).thenReturn(settings);
            when(profileSettingsRepository.save(any(UserProfileSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            var input = new PrivacyInput(USER_ID, null, VisibilitySetting.PRIVATE, null, null);
            updatePrivacySettingsUseCase.execute(input);

            verify(clearTrackedHistoryUseCase, never()).execute(any());
        }

        @Test
        @DisplayName("Deve limpar resíduos antes de sair de DO_NOT_TRACK")
        void deveLimparAoSairDeDoNotTrack() {
            User user = buildUser();
            UserProfileSettings settings = buildSettings(user);
            settings.setViewHistoryVisibility(VisibilitySetting.DO_NOT_TRACK);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(profileSettingsResolver.getOrCreate(user)).thenReturn(settings);
            when(profileSettingsRepository.save(any(UserProfileSettings.class))).thenAnswer(inv -> inv.getArgument(0));

            var input = new PrivacyInput(USER_ID, null, VisibilitySetting.PUBLIC, null, null);
            updatePrivacySettingsUseCase.execute(input);

            verify(clearTrackedHistoryUseCase).execute(USER_ID.toString());
            assertThat(settings.getViewHistoryVisibility()).isEqualTo(VisibilitySetting.PUBLIC);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        void rejectsContradictoryTrackingSettingsBeforeDeletingHistory() {
            var input = new PrivacyInput(USER_ID, null, VisibilitySetting.DO_NOT_TRACK,
                    null, null, true);

            assertThatThrownBy(() -> updatePrivacySettingsUseCase.execute(input))
                    .isInstanceOf(IllegalArgumentException.class);

            verify(clearTrackedHistoryUseCase, never()).execute(any());
            verify(clearBehaviorHistoryUseCase, never()).execute(any());
            verify(userRepository, never()).findById(any());
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existe")
        void deveLancarExcecaoQuandoUsuarioNaoExiste() {
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

            var input = new PrivacyInput(USER_ID, VisibilitySetting.PRIVATE, null, null, null);

            assertThatThrownBy(() -> updatePrivacySettingsUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }
}
