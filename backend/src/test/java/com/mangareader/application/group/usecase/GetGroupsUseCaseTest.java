package com.mangareader.application.group.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetGroupsUseCase")
class GetGroupsUseCaseTest {

    @Mock
    private GroupRepositoryPort groupRepository;

    @InjectMocks
    private GetGroupsUseCase getGroupsUseCase;

    @Test
    @DisplayName("Deve retornar página com grupos")
    void deveRetornarPaginaComGrupos() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        List<Group> groups = List.of(
                Group.builder().name("Grupo A").username("grupo-a").build(),
                Group.builder().name("Grupo B").username("grupo-b").build()
        );
        Page<Group> page = new PageImpl<>(groups, pageable, 2);
        when(groupRepository.findAll(pageable)).thenReturn(page);

        // Act
        Page<Group> result = getGroupsUseCase.execute(pageable);

        // Assert
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    @Test
    @DisplayName("Deve retornar página vazia quando não há grupos")
    void deveRetornarPaginaVazia() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Group> emptyPage = new PageImpl<>(List.of(), pageable, 0);
        when(groupRepository.findAll(pageable)).thenReturn(emptyPage);

        // Act
        Page<Group> result = getGroupsUseCase.execute(pageable);

        // Assert
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }
}
