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
import com.mangareader.domain.group.entity.GroupWork;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("RemoveWorkFromGroupUseCase")
class RemoveWorkFromGroupUseCaseTest {

    @Mock
    private GroupRepositoryPort groupRepository;

    @InjectMocks
    private RemoveWorkFromGroupUseCase removeWorkFromGroupUseCase;

    private final UUID GROUP_ID = UUID.randomUUID();
    private final UUID LEADER_ID = UUID.randomUUID();
    private final String TITLE_ID = "title-to-remove";

    private Group buildGroupWithLeaderAndWork() {
        User leader = User.builder().id(LEADER_ID).name("Líder").email("l@e.com").passwordHash("h").build();
        Group group = Group.builder()
                .id(GROUP_ID)
                .name("Scan Test")
                .username("scan-test")
                .totalTitles(1)
                .members(new ArrayList<>())
                .translatedWorks(new ArrayList<>())
                .build();
        group.getMembers().add(GroupMember.builder().group(group).user(leader).role(GroupRole.LIDER).build());
        group.getTranslatedWorks().add(
                GroupWork.builder().group(group).titleId(TITLE_ID).title("Obra Removível").build()
        );
        return group;
    }

    @Nested
    @DisplayName("Remoção com sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve remover obra do portfólio e decrementar totalTitles")
        void deveRemoverObraEDecrementarTotal() {
            // Arrange
            Group group = buildGroupWithLeaderAndWork();
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Group result = removeWorkFromGroupUseCase.execute(GROUP_ID, LEADER_ID, TITLE_ID);

            // Assert
            assertThat(result.getTranslatedWorks()).isEmpty();
            assertThat(result.getTotalTitles()).isEqualTo(0);
        }

        @Test
        @DisplayName("Deve garantir que totalTitles não fique negativo")
        void deveGarantirTotalTitlesNaoNegativo() {
            // Arrange
            Group group = buildGroupWithLeaderAndWork();
            group.setTotalTitles(0); // Simula inconsistência
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Group result = removeWorkFromGroupUseCase.execute(GROUP_ID, LEADER_ID, TITLE_ID);

            // Assert
            assertThat(result.getTotalTitles()).isEqualTo(0);
        }

        @Test
        @DisplayName("Deve persistir o grupo após remoção")
        void devePersistirAposRemocao() {
            // Arrange
            Group group = buildGroupWithLeaderAndWork();
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            removeWorkFromGroupUseCase.execute(GROUP_ID, LEADER_ID, TITLE_ID);

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
            assertThatThrownBy(() -> removeWorkFromGroupUseCase.execute(GROUP_ID, LEADER_ID, TITLE_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Group");
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException 403 quando usuário não é líder")
        void deveLancarExcecaoQuandoNaoELider() {
            // Arrange
            Group group = buildGroupWithLeaderAndWork();
            UUID membroId = UUID.randomUUID();
            User membro = User.builder().id(membroId).name("Membro").email("m@e.com").passwordHash("h").build();
            group.getMembers().add(GroupMember.builder().group(group).user(membro).role(GroupRole.TRADUTOR).build());

            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

            // Act & Assert
            assertThatThrownBy(() -> removeWorkFromGroupUseCase.execute(GROUP_ID, membroId, TITLE_ID))
                    .isInstanceOf(BusinessRuleException.class)
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(403));
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando obra não existe no portfólio")
        void deveLancarExcecaoQuandoObraNaoExiste() {
            // Arrange
            Group group = buildGroupWithLeaderAndWork();
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

            // Act & Assert
            assertThatThrownBy(() -> removeWorkFromGroupUseCase.execute(GROUP_ID, LEADER_ID, "title-inexistente"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("GroupWork");
        }
    }
}
