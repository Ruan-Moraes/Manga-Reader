package com.mangareader.application.group.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

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
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetGroupByIdUseCase")
class GetGroupByIdUseCaseTest {

    @Mock
    private GroupRepositoryPort groupRepository;

    @InjectMocks
    private GetGroupByIdUseCase getGroupByIdUseCase;

    private final UUID GROUP_ID = UUID.randomUUID();

    @Nested
    @DisplayName("Consulta com sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve retornar grupo quando encontrado pelo ID")
        void deveRetornarGrupoQuandoEncontrado() {
            // Arrange
            Group group = Group.builder().id(GROUP_ID).name("Scan Brasil").username("scan-brasil").build();
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.of(group));

            // Act
            Group result = getGroupByIdUseCase.execute(GROUP_ID);

            // Assert
            assertThat(result.getId()).isEqualTo(GROUP_ID);
            assertThat(result.getName()).isEqualTo("Scan Brasil");
        }
    }

    @Nested
    @DisplayName("Cenário de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando grupo não existe")
        void deveLancarExcecaoQuandoNaoExiste() {
            // Arrange
            when(groupRepository.findById(GROUP_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> getGroupByIdUseCase.execute(GROUP_ID))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Group");
        }
    }
}
