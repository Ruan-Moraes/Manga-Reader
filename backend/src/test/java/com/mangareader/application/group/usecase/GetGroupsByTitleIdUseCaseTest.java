package com.mangareader.application.group.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
@DisplayName("GetGroupsByTitleIdUseCase")
class GetGroupsByTitleIdUseCaseTest {

    @Mock
    private GroupRepositoryPort groupRepository;

    @InjectMocks
    private GetGroupsByTitleIdUseCase getGroupsByTitleIdUseCase;

    @Test
    @DisplayName("Deve retornar página de grupos que traduzem um título")
    void deveRetornarPaginaDeGruposDoTitulo() {
        // Arrange
        String titleId = "title-mongo-123";
        Pageable pageable = PageRequest.of(0, 20);
        List<Group> groups = List.of(
                Group.builder().name("Scan A").username("scan-a").build(),
                Group.builder().name("Scan B").username("scan-b").build()
        );
        Page<Group> page = new PageImpl<>(groups, pageable, 2);
        when(groupRepository.findByTitleId(eq(titleId), any(Pageable.class))).thenReturn(page);

        // Act
        Page<Group> result = getGroupsByTitleIdUseCase.execute(titleId, pageable);

        // Assert
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Scan A");
        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    @Test
    @DisplayName("Deve retornar página vazia quando nenhum grupo traduz o título")
    void deveRetornarPaginaVazia() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 20);
        Page<Group> emptyPage = Page.empty(pageable);
        when(groupRepository.findByTitleId(eq("title-sem-grupo"), any(Pageable.class))).thenReturn(emptyPage);

        // Act
        Page<Group> result = getGroupsByTitleIdUseCase.execute("title-sem-grupo", pageable);

        // Assert
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }
}
