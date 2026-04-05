package com.mangareader.application.group.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;

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
@DisplayName("GetGroupByUsernameUseCase")
class GetGroupByUsernameUseCaseTest {

    @Mock
    private GroupRepositoryPort groupRepository;

    @InjectMocks
    private GetGroupByUsernameUseCase getGroupByUsernameUseCase;

    @Nested
    @DisplayName("Consulta com sucesso")
    class Sucesso {

        @Test
        @DisplayName("Deve retornar grupo quando encontrado pelo username")
        void deveRetornarGrupoQuandoEncontrado() {
            // Arrange
            Group group = Group.builder().name("Scan Brasil").username("scan-brasil").build();
            when(groupRepository.findByUsernameWithUsers("scan-brasil")).thenReturn(Optional.of(group));

            // Act
            Group result = getGroupByUsernameUseCase.execute("scan-brasil");

            // Assert
            assertThat(result.getUsername()).isEqualTo("scan-brasil");
            assertThat(result.getName()).isEqualTo("Scan Brasil");
        }
    }

    @Nested
    @DisplayName("Cenário de erro")
    class Erro {

        @Test
        @DisplayName("Deve lançar ResourceNotFoundException quando username não existe")
        void deveLancarExcecaoQuandoNaoExiste() {
            // Arrange
            when(groupRepository.findByUsernameWithUsers("inexistente")).thenReturn(Optional.empty());

            // Act & Assert
            assertThatThrownBy(() -> getGroupByUsernameUseCase.execute("inexistente"))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("Group");
        }
    }
}
