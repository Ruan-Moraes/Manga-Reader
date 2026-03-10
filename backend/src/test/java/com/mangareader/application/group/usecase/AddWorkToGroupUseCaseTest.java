package com.mangareader.application.group.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
import com.mangareader.application.group.usecase.AddWorkToGroupUseCase.AddWorkInput;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupMember;
import com.mangareader.domain.group.entity.GroupWork;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.group.valueobject.GroupWorkStatus;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("AddWorkToGroupUseCase")
class AddWorkToGroupUseCaseTest {

    @Mock
    private GroupRepositoryPort groupRepository;

    @InjectMocks
    private AddWorkToGroupUseCase addWorkToGroupUseCase;

    private final UUID GROUP_ID = UUID.randomUUID();
    private final UUID MEMBER_ID = UUID.randomUUID();

    private Group buildGroupWithMember() {
        User member = User.builder().id(MEMBER_ID).name("Membro").email("m@e.com").passwordHash("h").build();
        Group group = Group.builder()
                .id(GROUP_ID)
                .name("Scan Test")
                .username("scan-test")
                .totalTitles(0)
                .members(new ArrayList<>())
                .translatedWorks(new ArrayList<>())
                .build();
        group.getMembers().add(GroupMember.builder().group(group).user(member).role(GroupRole.TRADUTOR).build());
        return group;
    }

    @Nested
    @DisplayName("Adição com sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve adicionar obra ao portfólio e incrementar totalTitles")
        void deveAdicionarObraEIncrementarTotal() {
            // Arrange
            Group group = buildGroupWithMember();
            var input = new AddWorkInput(GROUP_ID, MEMBER_ID, "title-mongo-1",
                    "One Piece", "cover.png", 1100, "ONGOING", List.of("Ação", "Aventura"));
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Group result = addWorkToGroupUseCase.execute(input);

            // Assert
            assertThat(result.getTranslatedWorks()).hasSize(1);
            assertThat(result.getTotalTitles()).isEqualTo(1);
            GroupWork work = result.getTranslatedWorks().get(0);
            assertThat(work.getTitleId()).isEqualTo("title-mongo-1");
            assertThat(work.getTitle()).isEqualTo("One Piece");
            assertThat(work.getChapters()).isEqualTo(1100);
            assertThat(work.getStatus()).isEqualTo(GroupWorkStatus.ONGOING);
            assertThat(work.getGenres()).containsExactly("Ação", "Aventura");
        }

        @Test
        @DisplayName("Deve usar status ONGOING como padrão quando status é null")
        void deveUsarStatusOngoingComoPadrao() {
            // Arrange
            Group group = buildGroupWithMember();
            var input = new AddWorkInput(GROUP_ID, MEMBER_ID, "title-2",
                    "Naruto", "cover2.png", 700, null, null);
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Group result = addWorkToGroupUseCase.execute(input);

            // Assert
            assertThat(result.getTranslatedWorks().get(0).getStatus()).isEqualTo(GroupWorkStatus.ONGOING);
            assertThat(result.getTranslatedWorks().get(0).getGenres()).isEmpty();
        }

        @Test
        @DisplayName("Deve aceitar status COMPLETED quando informado")
        void deveAceitarStatusCompleted() {
            // Arrange
            Group group = buildGroupWithMember();
            var input = new AddWorkInput(GROUP_ID, MEMBER_ID, "title-3",
                    "Death Note", "cover3.png", 108, "COMPLETED", List.of("Suspense"));
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Group result = addWorkToGroupUseCase.execute(input);

            // Assert
            assertThat(result.getTranslatedWorks().get(0).getStatus()).isEqualTo(GroupWorkStatus.COMPLETED);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando grupo não existe")
        void deveLancarExcecaoQuandoGrupoNaoExiste() {
            // Arrange
            var input = new AddWorkInput(GROUP_ID, MEMBER_ID, "t1", "Obra", null, 10, null, null);
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> addWorkToGroupUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Group");
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException 403 quando usuário não é membro")
        void deveLancarExcecaoQuandoNaoEMembro() {
            // Arrange
            Group group = buildGroupWithMember();
            UUID estranho = UUID.randomUUID();
            var input = new AddWorkInput(GROUP_ID, estranho, "t1", "Obra", null, 10, null, null);
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

            // Act & Assert
            assertThatThrownBy(() -> addWorkToGroupUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(403));
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException 409 quando título já existe no portfólio")
        void deveLancarExcecaoQuandoTituloJaExiste() {
            // Arrange
            Group group = buildGroupWithMember();
            group.getTranslatedWorks().add(
                    GroupWork.builder().group(group).titleId("title-dup").title("Existente").build()
            );
            var input = new AddWorkInput(GROUP_ID, MEMBER_ID, "title-dup", "Existente", null, 10, null, null);
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

            // Act & Assert
            assertThatThrownBy(() -> addWorkToGroupUseCase.execute(input))
                    .isInstanceOf(BusinessRuleException.class)
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(409));
        }
    }
}
