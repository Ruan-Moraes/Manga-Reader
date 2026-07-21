package com.mangareader.application.news.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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

@ExtendWith(MockitoExtension.class)
@DisplayName("ListAdminNewsUseCase")
class ListAdminNewsUseCaseTest {

    @Mock
    private NewsRepositoryPort newsRepository;

    @InjectMocks
    private ListAdminNewsUseCase useCase;

    private final Pageable pageable = PageRequest.of(0, 20);
    private final Page<NewsItem> page = new PageImpl<>(java.util.List.of());

    @Test
    @DisplayName("Sem filtros usa consulta administrativa")
    void semBuscaUsaFindAll() {
        when(newsRepository.findAdmin(" ", null, null, pageable)).thenReturn(page);

        assertThat(useCase.execute(" ", pageable)).isSameAs(page);

        verify(newsRepository).findAdmin(" ", null, null, pageable);
    }

    @Test
    @DisplayName("Com busca usa consulta administrativa")
    void comBuscaUsaSearch() {
        when(newsRepository.findAdmin("anime", null, null, pageable)).thenReturn(page);

        assertThat(useCase.execute("anime", pageable)).isSameAs(page);

        verify(newsRepository).findAdmin("anime", null, null, pageable);
    }
}
