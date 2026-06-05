package com.mangareader.application.news.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
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
@DisplayName("GetAdminNewsUseCase")
class GetAdminNewsUseCaseTest {

    @Mock
    private NewsRepositoryPort newsRepository;

    @InjectMocks
    private GetAdminNewsUseCase useCase;

    @Test
    @DisplayName("Retorna notícia quando encontrada")
    void retornaQuandoEncontrada() {
        NewsItem news = mock(NewsItem.class);
        when(newsRepository.findById("n1")).thenReturn(Optional.of(news));

        assertThat(useCase.execute("n1")).isSameAs(news);
    }

    @Test
    @DisplayName("Lança ResourceNotFoundException quando ausente")
    void lancaQuandoAusente() {
        when(newsRepository.findById("x")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> useCase.execute("x"))
                .isInstanceOf(ResourceNotFoundException.class);
    }
}
