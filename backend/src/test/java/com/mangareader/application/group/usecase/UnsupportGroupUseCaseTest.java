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
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupUser;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.group.valueobject.GroupUserType;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("UnsupportGroupUseCase")
class UnsupportGroupUseCaseTest {

    @Mock
    private GroupRepositoryPort groupRepository;

    @InjectMocks
    private UnsupportGroupUseCase unsupportGroupUseCase;

    private final UUID GROUP_ID = UUID.randomUUID();
    private final UUID LEADER_ID = UUID.randomUUID();
    private final UUID SUPPORTER_ID = UUID.randomUUID();

    private Group buildGroupWithSupporter() {
        User leader = User.builder().id(LEADER_ID).name("Líder").email("l@e.com").passwordHash("h").build();
        User supporter = User.builder().id(SUPPORTER_ID).name("Apoiador").email("a@e.com").passwordHash("h").build();

        Group group = Group.builder()
                .id(GROUP_ID)
                .name("Scan Test")
                .username("scan-test")
                .groupUsers(new ArrayList<>())
                .build();

        group.getGroupUsers().add(
                GroupUser.builder().group(group).user(leader).type(GroupUserType.MEMBER).role(GroupRole.LIDER).build()
        );
        group.getGroupUsers().add(
                GroupUser.builder().group(group).user(supporter).type(GroupUserType.SUPPORTER).build()
        );
        return group;
    }

    @Nested
    @DisplayName("Remoção de apoio com sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve remover apoiador do grupo")
        void deveRemoverApoiador() {
            Group group = buildGroupWithSupporter();
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            Group result = unsupportGroupUseCase.execute(GROUP_ID, SUPPORTER_ID);

            assertThat(result.getGroupUsers()).hasSize(1);
            assertThat(result.getGroupUsers().get(0).getType()).isEqualTo(GroupUserType.MEMBER);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando grupo não existe")
        void deveLancarExcecaoQuandoGrupoNaoExiste() {
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> unsupportGroupUseCase.execute(GROUP_ID, SUPPORTER_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Group");
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException 400 quando usuário não é apoiador")
        void deveLancarExcecaoQuandoNaoEApoiador() {
            Group group = buildGroupWithSupporter();
            UUID estranho = UUID.randomUUID();
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

            assertThatThrownBy(() -> unsupportGroupUseCase.execute(GROUP_ID, estranho))
                    .isInstanceOf(BusinessRuleException.class)
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(400));
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException 400 quando membro tenta usar unsupport")
        void deveLancarExcecaoQuandoMembroTentaUnsupport() {
            Group group = buildGroupWithSupporter();
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

            assertThatThrownBy(() -> unsupportGroupUseCase.execute(GROUP_ID, LEADER_ID))
                    .isInstanceOf(BusinessRuleException.class)
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(400));
        }
    }
}
