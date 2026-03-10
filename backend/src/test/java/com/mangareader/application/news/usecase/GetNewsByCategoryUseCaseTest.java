package com.mangareader.application.news.usecase;

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

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsCategory;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetNewsByCategoryUseCase")
class GetNewsByCategoryUseCaseTest {

    @Mock
    private NewsRepositoryPort newsRepository;

    @InjectMocks
    private GetNewsByCategoryUseCase getNewsByCategoryUseCase;

    @Test
    @DisplayName("Deve retornar notícias filtradas por categoria")
    void deveRetornarNoticiasFiltradas() {
        // Arrange
        NewsCategory category = NewsCategory.INDUSTRIA;
        Pageable pageable = PageRequest.of(0, 20);
        List<NewsItem> items = List.of(
                NewsItem.builder().title("Mercado de mangás cresce").category(category).build(),
                NewsItem.builder().title("Nova editora no Brasil").category(category).build()
        );
        Page<NewsItem> page = new PageImpl<>(items, pageable, 2);
        when(newsRepository.findByCategory(category, pageable)).thenReturn(page);

        // Act
        Page<NewsItem> result = getNewsByCategoryUseCase.execute(category, pageable);

        // Assert
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getContent()).allSatisfy(item ->
                assertThat(item.getCategory()).isEqualTo(NewsCategory.INDUSTRIA));
    }

    @Test
    @DisplayName("Deve retornar página vazia quando categoria não tem notícias")
    void deveRetornarPaginaVaziaParaCategoriaSemNoticias() {
        // Arrange
        NewsCategory category = NewsCategory.ENTREVISTAS;
        Pageable pageable = PageRequest.of(0, 20);
        Page<NewsItem> emptyPage = new PageImpl<>(List.of(), pageable, 0);
        when(newsRepository.findByCategory(category, pageable)).thenReturn(emptyPage);

        // Act
        Page<NewsItem> result = getNewsByCategoryUseCase.execute(category, pageable);

        // Assert
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }
}
