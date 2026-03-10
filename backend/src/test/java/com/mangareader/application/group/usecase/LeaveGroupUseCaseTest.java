package com.mangareader.application.group.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
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
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupMember;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("LeaveGroupUseCase")
class LeaveGroupUseCaseTest {

    @Mock
    private GroupRepositoryPort groupRepository;

    @InjectMocks
    private LeaveGroupUseCase leaveGroupUseCase;

    private final UUID GROUP_ID = UUID.randomUUID();
    private final UUID LEADER_ID = UUID.randomUUID();
    private final UUID MEMBER_ID = UUID.randomUUID();

    private Group buildGroupWithLeaderAndMember() {
        User leader = User.builder().id(LEADER_ID).name("Líder").email("l@e.com").passwordHash("h").build();
        User member = User.builder().id(MEMBER_ID).name("Tradutor").email("t@e.com").passwordHash("h").build();

        Group group = Group.builder()
                .id(GROUP_ID)
                .name("Scan Test")
                .username("scan-test")
                .members(new ArrayList<>())
                .build();

        group.getMembers().add(GroupMember.builder().group(group).user(leader).role(GroupRole.LIDER).build());
        group.getMembers().add(GroupMember.builder().group(group).user(member).role(GroupRole.TRADUTOR).build());
        return group;
    }

    @Nested
    @DisplayName("Saída com sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve remover membro não-líder do grupo")
        void deveRemoverMembroNaoLider() {
            // Arrange
            Group group = buildGroupWithLeaderAndMember();
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Group result = leaveGroupUseCase.execute(GROUP_ID, MEMBER_ID);

            // Assert
            assertThat(result.getMembers()).hasSize(1);
            assertThat(result.getMembers().get(0).getRole()).isEqualTo(GroupRole.LIDER);
        }

        @Test
        @DisplayName("Deve persistir grupo após remoção do membro")
        void devePersistirAposRemocao() {
            // Arrange
            Group group = buildGroupWithLeaderAndMember();
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            leaveGroupUseCase.execute(GROUP_ID, MEMBER_ID);

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
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> leaveGroupUseCase.execute(GROUP_ID, MEMBER_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Group");
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException 400 quando usuário não é membro")
        void deveLancarExcecaoQuandoNaoEMembro() {
            // Arrange
            Group group = buildGroupWithLeaderAndMember();
            UUID estranho = UUID.randomUUID();
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

            // Act & Assert
            assertThatThrownBy(() -> leaveGroupUseCase.execute(GROUP_ID, estranho))
                    .isInstanceOf(BusinessRuleException.class)
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(400));
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException 400 quando líder tenta sair")
        void deveLancarExcecaoQuandoLiderTentaSair() {
            // Arrange
            Group group = buildGroupWithLeaderAndMember();
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

            // Act & Assert
            assertThatThrownBy(() -> leaveGroupUseCase.execute(GROUP_ID, LEADER_ID))
                    .isInstanceOf(BusinessRuleException.class)
                    .hasMessageContaining("líder")
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(400));
        }
    }
}
