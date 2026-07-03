package com.mangareader.application.user.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.port.UserChapterReadRepositoryPort;
import com.mangareader.application.user.port.ViewHistoryRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupUser;
import com.mangareader.domain.group.valueobject.GroupUserType;
import com.mangareader.application.social.port.SocialGraphPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("DeleteAccountUseCase")
class DeleteAccountUseCaseTest {

    @Mock
    private UserRepositoryPort userRepository;

    @Mock
    private ViewHistoryRepositoryPort viewHistoryRepository;

    @Mock
    private UserChapterReadRepositoryPort userChapterReadRepository;

    @Mock
    private GroupRepositoryPort groupRepository;

    @Mock
    private SocialGraphPort socialGraph;

    @InjectMocks
    private DeleteAccountUseCase useCase;

    private final UUID USER_ID = UUID.randomUUID();

    private User user() {
        return User.builder()
                .id(USER_ID)
                .name("Ruan")
                .email("ruan@email.com")
                .passwordHash("hash")
                .build();
    }

    @Test
    @DisplayName("Deve remover vínculos, apagar histórico e desativar conta")
    void deveExcluirConta() {
        User user = user();

        Group group = Group.builder().id(UUID.randomUUID()).username("scan-op").build();
        group.getGroupUsers().add(GroupUser.builder()
                .group(group).user(user).type(GroupUserType.MEMBER).build());

        when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        when(groupRepository.findGroupsByMemberUserId(USER_ID)).thenReturn(new ArrayList<>(List.of(group)));

        useCase.execute(USER_ID);

        assertThat(group.getGroupUsers()).isEmpty();
        verify(groupRepository).save(group);
        verify(viewHistoryRepository).deleteAllByUserId(USER_ID.toString());
        verify(userChapterReadRepository).deleteAllByUserId(USER_ID.toString());

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().isDeactivated()).isTrue();
    }

    @Test
    @DisplayName("Deve lançar exceção quando usuário não existe")
    void deveLancarQuandoUsuarioInexistente() {
        when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(USER_ID))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(userRepository, never()).save(any());
        verify(viewHistoryRepository, never()).deleteAllByUserId(any());
    }
}
