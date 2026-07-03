package com.mangareader.application.social.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.social.port.SocialGraphPort;
import com.mangareader.application.social.port.SocialGraphPort.ProfileSocial;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("FollowUserUseCase (DT-48)")
class FollowUserUseCaseTest {

    @Mock
    private SocialGraphPort socialGraph;

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private FollowUserUseCase useCase;

    private final UUID FOLLOWER = UUID.randomUUID();
    private final UUID FOLLOWEE = UUID.randomUUID();

    private User buildTarget(boolean deactivated) {
        User user = User.builder()
                .id(FOLLOWEE)
                .name("Alvo")
                .email("alvo@mr.com")
                .passwordHash("hash")
                .build();
        if (deactivated) {
            user.setDeactivated(true);
        }
        return user;
    }

    @Test
    @DisplayName("Deve seguir usuário existente e retornar as contagens do alvo")
    void deveSeguir() {
        when(userRepository.findById(FOLLOWEE)).thenReturn(Optional.of(buildTarget(false)));
        when(socialGraph.getProfileSocial(FOLLOWEE, FOLLOWER)).thenReturn(new ProfileSocial(1, 0, true));

        ProfileSocial result = useCase.execute(FOLLOWER, FOLLOWEE);

        verify(socialGraph).follow(FOLLOWER, FOLLOWEE);
        assertThat(result.followers()).isEqualTo(1);
        assertThat(result.followedByViewer()).isTrue();
    }

    @Test
    @DisplayName("Não é possível seguir a si mesmo (409)")
    void naoSegueASiMesmo() {
        assertThatThrownBy(() -> useCase.execute(FOLLOWER, FOLLOWER))
                .isInstanceOf(BusinessRuleException.class)
                .satisfies(e -> assertThat(((BusinessRuleException) e).getStatusCode()).isEqualTo(409));

        verify(socialGraph, never()).follow(FOLLOWER, FOLLOWER);
    }

    @Test
    @DisplayName("Alvo inexistente ⇒ 404")
    void alvoInexistente() {
        when(userRepository.findById(FOLLOWEE)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(FOLLOWER, FOLLOWEE))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("Alvo desativado ⇒ 404")
    void alvoDesativado() {
        when(userRepository.findById(FOLLOWEE)).thenReturn(Optional.of(buildTarget(true)));

        assertThatThrownBy(() -> useCase.execute(FOLLOWER, FOLLOWEE))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(socialGraph, never()).follow(FOLLOWER, FOLLOWEE);
    }
}
