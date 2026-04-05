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
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupUser;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.group.valueobject.GroupUserType;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("SupportGroupUseCase")
class SupportGroupUseCaseTest {

    @Mock
    private GroupRepositoryPort groupRepository;

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private SupportGroupUseCase supportGroupUseCase;

    private final UUID GROUP_ID = UUID.randomUUID();
    private final UUID USER_ID = UUID.randomUUID();
    private final UUID LEADER_ID = UUID.randomUUID();

    private Group buildGroup() {
        User leader = User.builder().id(LEADER_ID).name("Líder").email("l@e.com").passwordHash("h").build();
        Group group = Group.builder()
                .id(GROUP_ID)
                .name("Scan Test")
                .username("scan-test")
                .groupUsers(new ArrayList<>())
                .build();
        group.getGroupUsers().add(
                GroupUser.builder().group(group).user(leader).type(GroupUserType.MEMBER).role(GroupRole.LIDER).build()
        );
        return group;
    }

    private User buildUser() {
        return User.builder().id(USER_ID).name("Apoiador").email("apoiador@email.com").passwordHash("h").build();
    }

    @Nested
    @DisplayName("Apoio com sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve adicionar usuário como apoiador do grupo")
        void deveAdicionarApoiador() {
            Group group = buildGroup();
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            Group result = supportGroupUseCase.execute(GROUP_ID, USER_ID);

            assertThat(result.getGroupUsers()).hasSize(2);
            GroupUser supporter = result.getGroupUsers().get(1);
            assertThat(supporter.getType()).isEqualTo(GroupUserType.SUPPORTER);
            assertThat(supporter.getRole()).isNull();
            assertThat(supporter.getUser().getId()).isEqualTo(USER_ID);
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando grupo não existe")
        void deveLancarExcecaoQuandoGrupoNaoExiste() {
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> supportGroupUseCase.execute(GROUP_ID, USER_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Group");
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando usuário não existe")
        void deveLancarExcecaoQuandoUsuarioNaoExiste() {
            Group group = buildGroup();
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> supportGroupUseCase.execute(GROUP_ID, USER_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }

        @Test
        @DisplayName("Deve lançar BusinessRuleException 409 quando usuário já possui vínculo")
        void deveLancarExcecaoQuandoJaTemVinculo() {
            Group group = buildGroup();
            User user = buildUser();
            group.getGroupUsers().add(
                    GroupUser.builder().group(group).user(user).type(GroupUserType.SUPPORTER).build()
            );
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> supportGroupUseCase.execute(GROUP_ID, USER_ID))
                    .isInstanceOf(BusinessRuleException.class)
                    .satisfies(ex -> assertThat(((BusinessRuleException) ex).getStatusCode()).isEqualTo(409));
        }
    }
}
