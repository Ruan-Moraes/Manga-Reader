package com.mangareader.application.category.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetTagByIdUseCase")
class GetTagByIdUseCaseTest {

    @Mock
    private TagRepositoryPort tagRepository;

    @InjectMocks
    private GetTagByIdUseCase getTagByIdUseCase;

    @Test
    @DisplayName("Deve retornar tag quando encontrada")
    void deveRetornarTagQuandoEncontrada() {
        // Arrange
        Long tagId = 1L;
        Tag tag = Tag.builder().id(tagId).label("Ação").build();
        when(tagRepository.findById(tagId)).thenReturn(Optional.of(tag));

        // Act
        Tag result = getTagByIdUseCase.execute(tagId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(tagId);
        assertThat(result.getLabel()).isEqualTo("Ação");
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando tag não existe")
    void deveLancarExcecaoQuandoTagNaoExiste() {
        // Arrange
        Long tagId = 999L;
        when(tagRepository.findById(tagId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> getTagByIdUseCase.execute(tagId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
