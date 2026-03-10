package com.mangareader.application.news.usecase;

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

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetNewsByIdUseCase")
class GetNewsByIdUseCaseTest {

    @Mock
    private NewsRepositoryPort newsRepository;

    @InjectMocks
    private GetNewsByIdUseCase getNewsByIdUseCase;

    @Test
    @DisplayName("Deve retornar notícia quando encontrada")
    void deveRetornarNoticiaQuandoEncontrada() {
        // Arrange
        String newsId = "64a1b2c3d4e5f6a7b8c9d0e1";
        NewsItem newsItem = NewsItem.builder()
                .id(newsId)
                .title("Novo capítulo de One Piece")
                .category(NewsCategory.LANCAMENTOS)
                .build();
        when(newsRepository.findById(newsId)).thenReturn(Optional.of(newsItem));

        // Act
        NewsItem result = getNewsByIdUseCase.execute(newsId);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(newsId);
        assertThat(result.getTitle()).isEqualTo("Novo capítulo de One Piece");
        assertThat(result.getCategory()).isEqualTo(NewsCategory.LANCAMENTOS);
    }

    @Test
    @DisplayName("Deve lançar ResourceNotFoundException quando notícia não existe")
    void deveLancarExcecaoQuandoNoticiaNaoExiste() {
        // Arrange
        String newsId = "64a1b2c3d4e5f6a7b8c9d0e1";
        when(newsRepository.findById(newsId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> getNewsByIdUseCase.execute(newsId))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
