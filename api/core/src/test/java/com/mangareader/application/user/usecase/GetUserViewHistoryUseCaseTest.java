package com.mangareader.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.mangareader.application.user.service.UserProfileSettingsResolver;
import com.mangareader.application.user.port.ViewHistoryRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.domain.user.entity.UserProfileSettings;
import com.mangareader.domain.user.entity.ViewHistory;
import com.mangareader.domain.user.valueobject.UserRole;
import com.mangareader.domain.user.valueobject.VisibilitySetting;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetUserViewHistoryUseCase")
class GetUserViewHistoryUseCaseTest {

    @Mock
    private GetUserProfileUseCase getUserProfileUseCase;

    @Mock
    private ViewHistoryRepositoryPort viewHistoryRepository;

    @Mock
    private UserProfileSettingsResolver profileSettingsResolver;

    @InjectMocks
    private GetUserViewHistoryUseCase useCase;

    private final Pageable pageable = PageRequest.of(0, 10);

    private User buildUser(UUID id) {
        return User.builder()
                .id(id)
                .name("Ruan")
                .email("ruan@email.com")
                .passwordHash("hash")
                .role(UserRole.MEMBER)
                .build();
    }

    private User stubUser(UUID id, VisibilitySetting visibility) {
        User user = buildUser(id);
        UserProfileSettings settings = UserProfileSettings.defaults(user);
        settings.setViewHistoryVisibility(visibility);

        when(getUserProfileUseCase.execute(id)).thenReturn(user);
        when(profileSettingsResolver.getOrDefault(user)).thenReturn(settings);

        return user;
    }

    private Page<ViewHistory> samplePage() {
        return new PageImpl<>(List.of(
                ViewHistory.builder().userId("u").titleId("t1").build()));
    }

    @Test
    @DisplayName("Dono vê o próprio histórico mesmo quando PRIVATE")
    void donoVeProprioHistoricoMesmoPrivate() {
        UUID userId = UUID.randomUUID();
        stubUser(userId, VisibilitySetting.PRIVATE);
        when(viewHistoryRepository.findByUserIdOrderByViewedAtDesc(eq(userId.toString()), any()))
                .thenReturn(samplePage());

        Page<ViewHistory> result = useCase.execute(userId, userId, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("Não-dono vê histórico quando visibilidade é PUBLIC")
    void naoDonoVeQuandoPublic() {
        UUID targetId = UUID.randomUUID();
        UUID viewerId = UUID.randomUUID();
        stubUser(targetId, VisibilitySetting.PUBLIC);
        when(viewHistoryRepository.findByUserIdOrderByViewedAtDesc(eq(targetId.toString()), any()))
                .thenReturn(samplePage());

        Page<ViewHistory> result = useCase.execute(targetId, viewerId, pageable);

        assertThat(result.getContent()).hasSize(1);
    }

    @Test
    @DisplayName("Não-dono recebe página vazia quando visibilidade é PRIVATE")
    void naoDonoRecebeVazioQuandoPrivate() {
        UUID targetId = UUID.randomUUID();
        UUID viewerId = UUID.randomUUID();
        stubUser(targetId, VisibilitySetting.PRIVATE);

        Page<ViewHistory> result = useCase.execute(targetId, viewerId, pageable);

        assertThat(result.getContent()).isEmpty();
        verify(viewHistoryRepository, never())
                .findByUserIdOrderByViewedAtDesc(any(), any());
    }

    @Test
    @DisplayName("Dono recebe página vazia quando visibilidade é DO_NOT_TRACK")
    void donoRecebeVazioQuandoDoNotTrack() {
        UUID userId = UUID.randomUUID();
        stubUser(userId, VisibilitySetting.DO_NOT_TRACK);

        Page<ViewHistory> result = useCase.execute(userId, userId, pageable);

        assertThat(result.getContent()).isEmpty();
        verify(viewHistoryRepository, never())
                .findByUserIdOrderByViewedAtDesc(any(), any());
    }

    @Test
    @DisplayName("Propaga ResourceNotFoundException quando usuário não existe")
    void propagaQuandoUsuarioNaoExiste() {
        UUID targetId = UUID.randomUUID();
        when(getUserProfileUseCase.execute(targetId))
                .thenThrow(new ResourceNotFoundException("User", "id", targetId));

        assertThatThrownBy(() -> useCase.execute(targetId, null, pageable))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
