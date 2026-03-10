package com.mangareader.application.category.usecase;

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

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;

@ExtendWith(MockitoExtension.class)
@DisplayName("SearchTagsUseCase")
class SearchTagsUseCaseTest {

    @Mock
    private TagRepositoryPort tagRepository;

    @InjectMocks
    private SearchTagsUseCase searchTagsUseCase;

    @Test
    @DisplayName("Deve retornar tags que correspondem à busca")
    void deveRetornarTagsCorrespondentes() {
        // Arrange
        String query = "aven";
        Pageable pageable = PageRequest.of(0, 20);
        List<Tag> tags = List.of(
                Tag.builder().id(1L).label("Aventura").build()
        );
        Page<Tag> page = new PageImpl<>(tags, pageable, 1);
        when(tagRepository.findByLabelContainingIgnoreCase(query, pageable)).thenReturn(page);

        // Act
        Page<Tag> result = searchTagsUseCase.execute(query, pageable);

        // Assert
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getLabel()).isEqualTo("Aventura");
    }

    @Test
    @DisplayName("Deve retornar página vazia quando busca não encontra resultados")
    void deveRetornarPaginaVaziaParaBuscaSemResultados() {
        // Arrange
        String query = "xyz";
        Pageable pageable = PageRequest.of(0, 20);
        Page<Tag> emptyPage = new PageImpl<>(List.of(), pageable, 0);
        when(tagRepository.findByLabelContainingIgnoreCase(query, pageable)).thenReturn(emptyPage);

        // Act
        Page<Tag> result = searchTagsUseCase.execute(query, pageable);

        // Assert
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }
}
