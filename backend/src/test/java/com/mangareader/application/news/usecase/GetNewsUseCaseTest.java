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
@DisplayName("GetNewsUseCase")
class GetNewsUseCaseTest {

    @Mock
    private NewsRepositoryPort newsRepository;

    @InjectMocks
    private GetNewsUseCase getNewsUseCase;

    @Test
    @DisplayName("Deve retornar página com notícias")
    void deveRetornarPaginaComNoticias() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 20);
        List<NewsItem> items = List.of(
                NewsItem.builder().title("Novo manga anunciado").category(NewsCategory.LANCAMENTOS).build(),
                NewsItem.builder().title("Evento de anime 2026").category(NewsCategory.EVENTOS).build()
        );
        Page<NewsItem> page = new PageImpl<>(items, pageable, 2);
        when(newsRepository.findAll(pageable)).thenReturn(page);

        // Act
        Page<NewsItem> result = getNewsUseCase.execute(pageable);

        // Assert
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    @Test
    @DisplayName("Deve retornar página vazia quando não há notícias")
    void deveRetornarPaginaVazia() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 20);
        Page<NewsItem> emptyPage = new PageImpl<>(List.of(), pageable, 0);
        when(newsRepository.findAll(pageable)).thenReturn(emptyPage);

        // Act
        Page<NewsItem> result = getNewsUseCase.execute(pageable);

        // Assert
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }
}
