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
@DisplayName("GetTagsUseCase")
class GetTagsUseCaseTest {

    @Mock
    private TagRepositoryPort tagRepository;

    @InjectMocks
    private GetTagsUseCase getTagsUseCase;

    @Test
    @DisplayName("Deve retornar página com tags")
    void deveRetornarPaginaComTags() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 20);
        List<Tag> tags = List.of(
                Tag.builder().id(1L).label("Ação").build(),
                Tag.builder().id(2L).label("Aventura").build(),
                Tag.builder().id(3L).label("Romance").build()
        );
        Page<Tag> page = new PageImpl<>(tags, pageable, 3);
        when(tagRepository.findAll(pageable)).thenReturn(page);

        // Act
        Page<Tag> result = getTagsUseCase.execute(pageable);

        // Assert
        assertThat(result.getContent()).hasSize(3);
        assertThat(result.getTotalElements()).isEqualTo(3);
    }

    @Test
    @DisplayName("Deve retornar página vazia quando não há tags")
    void deveRetornarPaginaVazia() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 20);
        Page<Tag> emptyPage = new PageImpl<>(List.of(), pageable, 0);
        when(tagRepository.findAll(pageable)).thenReturn(emptyPage);

        // Act
        Page<Tag> result = getTagsUseCase.execute(pageable);

        // Assert
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }
}
