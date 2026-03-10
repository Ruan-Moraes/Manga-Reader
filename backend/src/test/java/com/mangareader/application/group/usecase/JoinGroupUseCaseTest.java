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
import com.mangareader.domain.group.entity.GroupMember;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

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
        User leader = User.builder().id(LEADER_ID).name("Líder").email("l@e.com").passwordHash("h").build();
        Group group = Group.builder()
                .id(GROUP_ID)
                .name("Scan Test")
                .username("scan-test")
                .members(new ArrayList<>())
                .build();
        group.getMembers().add(GroupMember.builder().group(group).user(leader).role(GroupRole.LIDER).build());
        return group;
    }

    private User buildNewUser() {
        return User.builder().id(USER_ID).name("Novo Membro").email("novo@email.com").passwordHash("h").build();
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
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildNewUser()));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Group result = joinGroupUseCase.execute(input);

            // Assert
            assertThat(result.getMembers()).hasSize(2);
            GroupMember newMember = result.getMembers().get(1);
            assertThat(newMember.getRole()).isEqualTo(GroupRole.TRADUTOR);
            assertThat(newMember.getUser().getId()).isEqualTo(USER_ID);
        }

        @Test
        @DisplayName("Deve adicionar membro com role específica quando informada")
        void deveAdicionarMembroComRoleEspecifica() {
            // Arrange
            Group group = buildGroupWithLeader();
            var input = new JoinGroupInput(GROUP_ID, USER_ID, GroupRole.REVISOR);
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildNewUser()));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Group result = joinGroupUseCase.execute(input);

            // Assert
            GroupMember newMember = result.getMembers().get(1);
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
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.empty());

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
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
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
            group.getMembers().add(GroupMember.builder().group(group).user(existingUser).role(GroupRole.TRADUTOR).build());

            var input = new JoinGroupInput(GROUP_ID, USER_ID, null);
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

            // Act & Assert
            assertThatThrownBy(() -> joinGroupUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(409));
        }
    }
}
