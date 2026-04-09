package com.mangareader.application.news.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
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
@DisplayName("UpdateNewsUseCase")
class UpdateNewsUseCaseTest {

    @Mock
    private NewsRepositoryPort newsRepository;

    @InjectMocks
    private UpdateNewsUseCase updateNewsUseCase;

    private NewsItem buildNews() {
        return NewsItem.builder()
                .id("news-1")
                .title("Original Title")
                .category(NewsCategory.PRINCIPAIS)
                .readTime(3)
                .build();
    }

    @Test
    @DisplayName("Deve atualizar apenas campos não-null")
    void deveAtualizarApenasCamposNaoNull() {
        NewsItem news = buildNews();
        when(newsRepository.findById("news-1")).thenReturn(Optional.of(news));
        when(newsRepository.save(any(NewsItem.class))).thenAnswer(inv -> inv.getArgument(0));

        NewsItem result = updateNewsUseCase.execute(
                "news-1", "Updated Title", null, null, null, null,
                null, null, null, null, null, null, null
        );

        assertThat(result.getTitle()).isEqualTo("Updated Title");
        assertThat(result.getCategory()).isEqualTo(NewsCategory.PRINCIPAIS);
        assertThat(result.getReadTime()).isEqualTo(3);
        verify(newsRepository).save(news);
    }

    @Test
    @DisplayName("Deve lançar exceção quando notícia não existe")
    void deveLancarExcecaoQuandoNaoExiste() {
        when(newsRepository.findById("invalid")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> updateNewsUseCase.execute(
                "invalid", "Title", null, null, null, null,
                null, null, null, null, null, null, null
        ))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("News");
    }
}
