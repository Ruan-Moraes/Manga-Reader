package com.mangareader.application.group.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupUser;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminRemoveGroupMemberUseCase")
class AdminRemoveGroupMemberUseCaseTest {

    @Mock
    private GroupRepositoryPort groupRepository;

    @InjectMocks
    private AdminRemoveGroupMemberUseCase useCase;

    private final UUID GROUP_ID = UUID.randomUUID();
    private final UUID USER_ID = UUID.randomUUID();

    @Test
    @DisplayName("Deve remover membro do grupo")
    void deveRemoverMembroDoGrupo() {
        User user = User.builder().id(USER_ID).name("User").email("u@test.com").build();
        GroupUser gu = GroupUser.builder().user(user).role(GroupRole.TRADUTOR).build();
        Group group = Group.builder().id(GROUP_ID).name("G").username("g")
                .groupUsers(new ArrayList<>()).build();
        group.getGroupUsers().add(gu);

        when(groupRepository.findByIdWithUsers(GROUP_ID)).thenReturn(Optional.of(group));
        when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

        Group result = useCase.execute(GROUP_ID, USER_ID);

        assertThat(result.getGroupUsers()).isEmpty();
    }

    @Test
    @DisplayName("Deve lançar exceção quando membro não encontrado")
    void deveLancarExcecaoQuandoMembroNaoEncontrado() {
        Group group = Group.builder().id(GROUP_ID).name("G").username("g")
                .groupUsers(new ArrayList<>()).build();
        when(groupRepository.findByIdWithUsers(GROUP_ID)).thenReturn(Optional.of(group));

        assertThatThrownBy(() -> useCase.execute(GROUP_ID, USER_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("GroupUser");
    }

    @Test
    @DisplayName("Deve lançar exceção quando grupo não existe")
    void deveLancarExcecaoQuandoGrupoNaoExiste() {
        when(groupRepository.findByIdWithUsers(GROUP_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(GROUP_ID, USER_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Group");
    }
}
