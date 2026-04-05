package com.mangareader.application.group.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.ArrayList;
import java.util.List;
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
import com.mangareader.application.group.usecase.UpdateGroupUseCase.UpdateGroupInput;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupUser;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.group.valueobject.GroupUserType;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("UpdateGroupUseCase")
class UpdateGroupUseCaseTest {

    @Mock
    private GroupRepositoryPort groupRepository;

    @InjectMocks
    private UpdateGroupUseCase updateGroupUseCase;

    private final UUID GROUP_ID = UUID.randomUUID();
    private final UUID LEADER_ID = UUID.randomUUID();

    private Group buildGroupWithLeader() {
        User leader = User.builder().id(LEADER_ID).name("Líder").email("lider@email.com").passwordHash("h").build();
        Group group = Group.builder()
                .id(GROUP_ID)
                .name("Grupo Original")
                .username("grupo-original")
                .description("Descrição antiga")
                .logo("old-logo.png")
                .banner("old-banner.png")
                .website("https://old.com")
                .groupUsers(new ArrayList<>())
                .build();
        GroupUser leaderMember = GroupUser.builder().group(group).user(leader).type(GroupUserType.MEMBER).role(GroupRole.LIDER).build();
        group.getGroupUsers().add(leaderMember);
        return group;
    }

    @Nested
    @DisplayName("Atualização parcial (PATCH semântico)")
    class AtualizacaoParcial {

        @Test
        @DisplayName("Deve atualizar apenas o nome quando outros campos são null")
        void deveAtualizarApenasNome() {
            // Arrange
            Group group = buildGroupWithLeader();
            var input = new UpdateGroupInput(GROUP_ID, LEADER_ID, "Novo Nome", null, null, null, null);
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Group result = updateGroupUseCase.execute(input);

            // Assert
            assertThat(result.getName()).isEqualTo("Novo Nome");
            assertThat(result.getDescription()).isEqualTo("Descrição antiga");
            assertThat(result.getLogo()).isEqualTo("old-logo.png");
        }

        @Test
        @DisplayName("Deve atualizar todos os campos simultaneamente")
        void deveAtualizarTodosCampos() {
            // Arrange
            Group group = buildGroupWithLeader();
            var input = new UpdateGroupInput(GROUP_ID, LEADER_ID,
                    "Novo Nome", "Nova desc", "new-logo.png", "new-banner.png", "https://new.com");
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Group result = updateGroupUseCase.execute(input);

            // Assert
            assertThat(result.getName()).isEqualTo("Novo Nome");
            assertThat(result.getDescription()).isEqualTo("Nova desc");
            assertThat(result.getLogo()).isEqualTo("new-logo.png");
            assertThat(result.getBanner()).isEqualTo("new-banner.png");
            assertThat(result.getWebsite()).isEqualTo("https://new.com");
        }

        @Test
        @DisplayName("Deve persistir as alterações via repositório")
        void devePersistirAlteracoes() {
            // Arrange
            Group group = buildGroupWithLeader();
            var input = new UpdateGroupInput(GROUP_ID, LEADER_ID, "Atualizado", null, null, null, null);
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            updateGroupUseCase.execute(input);

            // Assert
            verify(groupRepository).save(group);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando grupo não existe")
        void deveLancarExcecaoQuandoGrupoNaoExiste() {
            // Arrange
            var input = new UpdateGroupInput(GROUP_ID, LEADER_ID, "Novo", null, null, null, null);
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> updateGroupUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Group");
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException 403 quando usuário não é líder")
        void deveLancarExcecaoQuandoNaoELider() {
            // Arrange
            Group group = buildGroupWithLeader();
            UUID outroUsuario = UUID.randomUUID();
            var input = new UpdateGroupInput(GROUP_ID, outroUsuario, "Novo", null, null, null, null);
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

            // Act & Assert
            assertThatThrownBy(() -> updateGroupUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(403));
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException 403 quando membro não-líder tenta editar")
        void deveLancarExcecaoQuandoMembroNaoLiderTentaEditar() {
            // Arrange
            Group group = buildGroupWithLeader();
            UUID membroId = UUID.randomUUID();
            User membro = User.builder().id(membroId).name("Membro").email("m@e.com").passwordHash("h").build();
            group.getGroupUsers().add(GroupUser.builder().group(group).user(membro).type(GroupUserType.MEMBER).role(GroupRole.TRADUTOR).build());

            var input = new UpdateGroupInput(GROUP_ID, membroId, "Novo", null, null, null, null);
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

            // Act & Assert
            assertThatThrownBy(() -> updateGroupUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(403));
        }
    }
}
