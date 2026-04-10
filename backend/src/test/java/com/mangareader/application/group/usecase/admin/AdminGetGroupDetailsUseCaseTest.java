package com.mangareader.application.group.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

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
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminGetGroupDetailsUseCase")
class AdminGetGroupDetailsUseCaseTest {

    @Mock
    private GroupRepositoryPort groupRepository;

    @InjectMocks
    private AdminGetGroupDetailsUseCase useCase;

    private final UUID GROUP_ID = UUID.randomUUID();

    @Test
    @DisplayName("Deve retornar grupo com detalhes")
    void deveRetornarGrupoComDetalhes() {
        Group group = Group.builder().id(GROUP_ID).name("Test Group").username("test").build();
        when(groupRepository.findByIdWithUsers(GROUP_ID)).thenReturn(Optional.of(group));

        Group result = useCase.execute(GROUP_ID);

        assertThat(result.getName()).isEqualTo("Test Group");
    }

    @Test
    @DisplayName("Deve lançar exceção quando grupo não existe")
    void deveLancarExcecaoQuandoNaoExiste() {
        when(groupRepository.findByIdWithUsers(GROUP_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute(GROUP_ID))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Group");
    }
}
