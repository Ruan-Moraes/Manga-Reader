package com.mangareader.application.news.usecase.admin;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
import com.mangareader.shared.exception.ResourceNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("DeleteNewsUseCase")
class DeleteNewsUseCaseTest {

    @Mock
    private NewsRepositoryPort newsRepository;

    @InjectMocks
    private DeleteNewsUseCase deleteNewsUseCase;

    @Test
    @DisplayName("Deve excluir notícia existente")
    void deveExcluirNoticiaExistente() {
        NewsItem news = NewsItem.builder().id("news-1").title("Test").build();
        when(newsRepository.findById("news-1")).thenReturn(Optional.of(news));

        deleteNewsUseCase.execute("news-1");

        verify(newsRepository).deleteById("news-1");
    }

    @Test
    @DisplayName("Deve lançar exceção quando notícia não existe")
    void deveLancarExcecaoQuandoNaoExiste() {
        when(newsRepository.findById("invalid")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> deleteNewsUseCase.execute("invalid"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("News");
    }
}
