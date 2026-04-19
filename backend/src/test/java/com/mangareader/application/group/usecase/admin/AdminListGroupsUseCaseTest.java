package com.mangareader.application.group.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.domain.group.entity.Group;

@ExtendWith(MockitoExtension.class)
@DisplayName("AdminListGroupsUseCase")
class AdminListGroupsUseCaseTest {

    @Mock
    private GroupRepositoryPort groupRepository;

    @InjectMocks
    private AdminListGroupsUseCase useCase;

    @Test
    @DisplayName("Deve listar todos os grupos sem filtro")
    void deveListarTodosSemFiltro() {
        var page = new PageImpl<>(List.of(Group.builder().name("Group 1").build()));
        Pageable pageable = PageRequest.of(0, 20);
        when(groupRepository.findAll(pageable)).thenReturn(page);

        var result = useCase.execute(null, pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(groupRepository).findAll(pageable);
    }

    @Test
    @DisplayName("Deve buscar grupos por nome")
    void deveBuscarPorNome() {
        var page = new PageImpl<>(List.of(Group.builder().name("Scan Team").build()));
        Pageable pageable = PageRequest.of(0, 20);
        when(groupRepository.searchByName(eq("scan"), any(Pageable.class))).thenReturn(page);

        var result = useCase.execute("scan", pageable);

        assertThat(result.getContent()).hasSize(1);
        verify(groupRepository).searchByName("scan", pageable);
    }

    @Test
    @DisplayName("Deve usar findAll quando search é vazio")
    void deveUsarFindAllQuandoSearchVazio() {
        var page = new PageImpl<>(List.<Group>of());
        Pageable pageable = PageRequest.of(0, 20);
        when(groupRepository.findAll(pageable)).thenReturn(page);

        useCase.execute("  ", pageable);

        verify(groupRepository).findAll(pageable);
    }
}
