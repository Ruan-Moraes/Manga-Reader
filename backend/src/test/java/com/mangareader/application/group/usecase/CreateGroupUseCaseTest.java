package com.mangareader.application.group.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.application.group.usecase.CreateGroupUseCase.CreateGroupInput;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.group.valueobject.GroupStatus;
import com.mangareader.domain.user.entity.User;
import com.mangareader.shared.exception.DuplicateResourceException;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("CreateGroupUseCase")
class CreateGroupUseCaseTest {

    @Mock
    private GroupRepositoryPort groupRepository;

    @Mock
    private UserRepositoryPort userRepository;

    @InjectMocks
    private CreateGroupUseCase createGroupUseCase;

    private final UUID USER_ID = UUID.randomUUID();

    private User buildUser() {
        return User.builder()
                .id(USER_ID)
                .name("Ruan Silva")
                .email("ruan@email.com")
                .passwordHash("hash")
                .build();
    }

    private CreateGroupInput buildInput() {
        return new CreateGroupInput(
                USER_ID, "Scan Brasil", "scan-brasil",
                "Melhor grupo de scanlation", "logo.png", "banner.png",
                "https://scan-brasil.com", 2020
        );
    }

    @Nested
    @DisplayName("Criação com sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve criar grupo com status ACTIVE e líder auto-atribuído")
        void deveCriarGrupoComLiderAutoAtribuido() {
            // Arrange
            var input = buildInput();
            when(groupRepository.existsByUsername("scan-brasil")).thenReturn(false);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Group result = createGroupUseCase.execute(input);

            // Assert
            assertThat(result.getName()).isEqualTo("Scan Brasil");
            assertThat(result.getUsername()).isEqualTo("scan-brasil");
            assertThat(result.getStatus()).isEqualTo(GroupStatus.ACTIVE);
            assertThat(result.getGroupUsers()).hasSize(1);
            assertThat(result.getGroupUsers().get(0).getRole()).isEqualTo(GroupRole.LIDER);
            assertThat(result.getGroupUsers().get(0).getUser().getId()).isEqualTo(USER_ID);
        }

        @Test
        @DisplayName("Deve preencher todos os campos opcionais do grupo")
        void devePreencherCamposOpcionais() {
            // Arrange
            var input = buildInput();
            when(groupRepository.existsByUsername("scan-brasil")).thenReturn(false);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            Group result = createGroupUseCase.execute(input);

            // Assert
            assertThat(result.getDescription()).isEqualTo("Melhor grupo de scanlation");
            assertThat(result.getLogo()).isEqualTo("logo.png");
            assertThat(result.getBanner()).isEqualTo("banner.png");
            assertThat(result.getWebsite()).isEqualTo("https://scan-brasil.com");
            assertThat(result.getFoundedYear()).isEqualTo(2020);
        }

        @Test
        @DisplayName("Deve persistir o grupo via repositório")
        void devePersistirGrupo() {
            // Arrange
            var input = buildInput();
            when(groupRepository.existsByUsername("scan-brasil")).thenReturn(false);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(buildUser()));
            when(groupRepository.save(any(Group.class))).thenAnswer(inv -> inv.getArgument(0));

            // Act
            createGroupUseCase.execute(input);

            // Assert
            ArgumentCaptor<Group> captor = ArgumentCaptor.forClass(Group.class);
            verify(groupRepository).save(captor.capture());
            assertThat(captor.getValue().getName()).isEqualTo("Scan Brasil");
        }
    }

    @Nested
    @DisplayName("Cenários de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar DuplicateResourceException quando username já existe")
        void deveLancarExcecaoQuandoUsernameJaExiste() {
            // Arrange
            var input = buildInput();
            when(groupRepository.existsByUsername("scan-brasil")).thenReturn(true);

            // Act & Assert
            assertThatThrownBy(() -> createGroupUseCase.execute(input))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("Group");
        }

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando usuário criador não existe")
        void deveLancarExcecaoQuandoUsuarioNaoExiste() {
            // Arrange
            var input = buildInput();
            when(groupRepository.existsByUsername("scan-brasil")).thenReturn(false);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> createGroupUseCase.execute(input))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("User");
        }
    }
}
