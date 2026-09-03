package com.mangareader.application.group.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.application.group.usecase.JoinGroupUseCase.JoinGroupInput;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupUser;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.group.valueobject.GroupUserType;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;
import com.mangareader.mock.user.UserMock;

@ExtendWith(MockitoExtension.class)
@DisplayName("JoinGroupUseCase")
class JoinGroupUseCaseTest {

    @Mock
    private GroupRepositoryPort groupRepository;

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private JoinGroupUseCase joinGroupUseCase;

    private final UUID GROUP_ID = UUID.randomUUID();
    private final UUID USER_ID = UUID.randomUUID();
    private final UUID LEADER_ID = UUID.randomUUID();

    private Group buildGroupWithLeader() {
        User leader = UserMock.withId(LEADER_ID);
        Group group = Group.builder()
                .id(GROUP_ID)
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Scan Test"))
                .username("scan-test")
                .groupUsers(new ArrayList<>())
                .build();
        group.getGroupUsers().add(GroupUser.builder().group(group).user(leader).type(GroupUserType.MEMBER).role(GroupRole.LIDER).build());
        return group;
    }

    private User buildNewUser() {
        return UserMock.withId(USER_ID);
    }

    @Nested
    @DisplayName("Ingresso com sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve adicionar membro com role TRADUTOR quando role é null")
        void deveAdicionarMembroComRolePadrao() {
            // Arrange
            Group group = buildGroupWithLeader();
            var input = new JoinGroupInput(GROUP_ID, USER_ID, null);
            when(groupRepository.findByIdWithUsers(GROUP_ID)).thenReturn(Optional.of(group));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildNewUser()));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Group result = joinGroupUseCase.execute(input);

            // Assert
            assertThat(result.getGroupUsers()).hasSize(2);
            GroupUser newMember = result.getGroupUsers().get(1);
            assertThat(newMember.getRole()).isEqualTo(GroupRole.TRADUTOR);
            assertThat(newMember.getUser().getId()).isEqualTo(USER_ID);
        }

        @Test
        @DisplayName("Deve adicionar membro com role específica quando informada")
        void deveAdicionarMembroComRoleEspecifica() {
            // Arrange
            Group group = buildGroupWithLeader();
            var input = new JoinGroupInput(GROUP_ID, USER_ID, GroupRole.REVISOR);
            when(groupRepository.findByIdWithUsers(GROUP_ID)).thenReturn(Optional.of(group));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildNewUser()));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Group result = joinGroupUseCase.execute(input);

            // Assert
            GroupUser newMember = result.getGroupUsers().get(1);
            assertThat(newMember.getRole()).isEqualTo(GroupRole.REVISOR);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando grupo não existe")
        void deveLancarExcecaoQuandoGrupoNaoExiste() {
            // Arrange
            var input = new JoinGroupInput(GROUP_ID, USER_ID, null);
            when(groupRepository.findByIdWithUsers(GROUP_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> joinGroupUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Group");
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existe")
        void deveLancarExcecaoQuandoUsuarioNaoExiste() {
            // Arrange
            Group group = buildGroupWithLeader();
            var input = new JoinGroupInput(GROUP_ID, USER_ID, null);
            when(groupRepository.findByIdWithUsers(GROUP_ID)).thenReturn(Optional.of(group));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> joinGroupUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException 409 quando usuário já é membro")
        void deveLancarExcecaoQuandoJaEMembro() {
            // Arrange
            Group group = buildGroupWithLeader();
            // Adicionar o USER_ID como membro existente
            User existingUser = buildNewUser();
            group.getGroupUsers().add(GroupUser.builder().group(group).user(existingUser).type(GroupUserType.MEMBER).role(GroupRole.TRADUTOR).build());

            var input = new JoinGroupInput(GROUP_ID, USER_ID, null);
            when(groupRepository.findByIdWithUsers(GROUP_ID)).thenReturn(Optional.of(group));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(existingUser));

            // Act & Assert
            assertThatThrownBy(() -> joinGroupUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(409));
        }
    }
}
