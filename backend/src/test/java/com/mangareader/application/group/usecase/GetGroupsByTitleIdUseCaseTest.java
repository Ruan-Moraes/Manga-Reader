package com.mangareader.application.group.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetGroupsByTitleIdUseCase")
class GetGroupsByTitleIdUseCaseTest {

    @Mock
    private GroupRepositoryPort groupRepository;

    @InjectMocks
    private GetGroupsByTitleIdUseCase getGroupsByTitleIdUseCase;

    @Test
    @DisplayName("Deve retornar grupos que traduzem um título")
    void deveRetornarGruposDoTitulo() {
        // Arrange
        String titleId = "title-mongo-123";
        List<Group> groups = List.of(
                Group.builder().name("Scan A").username("scan-a").build(),
                Group.builder().name("Scan B").username("scan-b").build()
        );
        when(groupRepository.findByTitleId(titleId)).thenReturn(groups);

        // Act
        List<Group> result = getGroupsByTitleIdUseCase.execute(titleId);

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getName()).isEqualTo("Scan A");
    }

    @Test
    @DisplayName("Deve retornar lista vazia quando nenhum grupo traduz o título")
    void deveRetornarListaVazia() {
        // Arrange
        when(groupRepository.findByTitleId("title-sem-grupo")).thenReturn(Collections.emptyList());

        // Act
        List<Group> result = getGroupsByTitleIdUseCase.execute("title-sem-grupo");

        // Assert
        assertThat(result).isEmpty();
    }
}
