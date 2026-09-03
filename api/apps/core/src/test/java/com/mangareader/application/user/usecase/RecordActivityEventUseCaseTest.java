package com.mangareader.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.user.port.ActivityEventRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.service.UserProfileSettingsResolver;
import com.mangareader.domain.user.entity.ActivityEvent;
import com.mangareader.domain.user.entity.ActivityEventType;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserProfileSettings;
import com.mangareader.domain.user.entity.activity.TitleCompletedPayload;
import com.mangareader.domain.user.valueobject.VisibilitySetting;

@ExtendWith(MockitoExtension.class)
@DisplayName("RecordActivityEventUseCase")
class RecordActivityEventUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private UserProfileSettingsResolver profileSettingsResolver;

    @Mock
    private ActivityEventRepositoryPort activityEventRepository;

    @InjectMocks
    private RecordActivityEventUseCase useCase;

    private final UUID userId = UUID.randomUUID();
    private final TitleCompletedPayload payload = new TitleCompletedPayload("t1", "Naruto", "cover.jpg");

    private void stubVisibility(VisibilitySetting visibility) {
        User user = User.builder().id(userId).name("Ruan").email("r@mr.com").passwordHash("hash").build();
        UserProfileSettings settings = UserProfileSettings.defaults(user);
        settings.setViewHistoryVisibility(visibility);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(profileSettingsResolver.getOrDefault(user)).thenReturn(settings);
    }

    @Test
    @DisplayName("Deve persistir atividade quando o histórico é rastreado")
    void devePersistirQuandoRastreado() {
        stubVisibility(VisibilitySetting.PRIVATE);

        useCase.execute("event-1", userId.toString(), ActivityEventType.TITLE_COMPLETED, payload);

        ArgumentCaptor<ActivityEvent> captor = ArgumentCaptor.forClass(ActivityEvent.class);
        verify(activityEventRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo(userId.toString());
        assertThat(captor.getValue().getId()).isEqualTo("event-1");
        assertThat(captor.getValue().getType()).isEqualTo(ActivityEventType.TITLE_COMPLETED);
        assertThat(captor.getValue().getPayload()).isEqualTo(payload);
    }

    @Test
    @DisplayName("Não deve persistir atividade quando DO_NOT_TRACK")
    void naoDevePersistirQuandoDoNotTrack() {
        stubVisibility(VisibilitySetting.DO_NOT_TRACK);

        useCase.execute(userId.toString(), ActivityEventType.TITLE_COMPLETED, payload);

        verify(activityEventRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve ignorar entrega atrasada de usuário inexistente")
    void deveIgnorarUsuarioInexistente() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        useCase.execute(userId.toString(), ActivityEventType.TITLE_COMPLETED, payload);

        verify(activityEventRepository, never()).save(any());
    }

    @Test
    @DisplayName("Deve ignorar entrega atrasada de usuário desativado")
    void deveIgnorarUsuarioDesativado() {
        User user = User.builder().id(userId).name("Ruan").email("r@mr.com").passwordHash("hash").build();
        user.deactivate();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        useCase.execute(userId.toString(), ActivityEventType.TITLE_COMPLETED, payload);

        verify(activityEventRepository, never()).save(any());
        verify(profileSettingsResolver, never()).getOrDefault(any());
    }
}
