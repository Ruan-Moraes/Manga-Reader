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
@DisplayName("SearchNewsUseCase")
class SearchNewsUseCaseTest {

    @Mock
    private NewsRepositoryPort newsRepository;

    @InjectMocks
    private SearchNewsUseCase searchNewsUseCase;

    @Test
    @DisplayName("Deve retornar notícias que correspondem à busca")
    void deveRetornarNoticiasCorrespondentes() {
        // Arrange
        String query = "One Piece";
        Pageable pageable = PageRequest.of(0, 20);
        List<NewsItem> items = List.of(
                NewsItem.builder().title("One Piece capítulo 1120").category(NewsCategory.LANCAMENTOS).build(),
                NewsItem.builder().title("One Piece: novo arco confirmado").category(NewsCategory.PRINCIPAIS).build()
        );
        Page<NewsItem> page = new PageImpl<>(items, pageable, 2);
        when(newsRepository.searchByTitle(query, pageable)).thenReturn(page);

        // Act
        Page<NewsItem> result = searchNewsUseCase.execute(query, pageable);

        // Assert
        assertThat(result.getContent()).hasSize(2);
        assertThat(result.getTotalElements()).isEqualTo(2);
    }

    @Test
    @DisplayName("Deve retornar página vazia quando busca não encontra resultados")
    void deveRetornarPaginaVaziaParaBuscaSemResultados() {
        // Arrange
        String query = "xyz inexistente";
        Pageable pageable = PageRequest.of(0, 20);
        Page<NewsItem> emptyPage = new PageImpl<>(List.of(), pageable, 0);
        when(newsRepository.searchByTitle(query, pageable)).thenReturn(emptyPage);

        // Act
        Page<NewsItem> result = searchNewsUseCase.execute(query, pageable);

        // Assert
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }
}
