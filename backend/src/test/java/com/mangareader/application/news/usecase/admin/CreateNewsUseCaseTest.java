package com.mangareader.application.news.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;

@ExtendWith(MockitoExtension.class)
@DisplayName("CreateNewsUseCase")
class CreateNewsUseCaseTest {

    @Mock
    private NewsRepositoryPort newsRepository;

    @InjectMocks
    private CreateNewsUseCase createNewsUseCase;

    @Test
    @DisplayName("Deve criar notícia com todos os campos")
    void deveCriarNoticiaComTodosCampos() {
        when(newsRepository.save(any(NewsItem.class))).thenAnswer(inv -> {
            NewsItem n = inv.getArgument(0);
            n.setId("news-1");
            return n;
        });

        NewsAuthor author = NewsAuthor.builder().name("Editor").build();

        NewsItem result = createNewsUseCase.execute(
                java.util.Map.of("pt-BR", "Breaking News"), java.util.Map.of("pt-BR", "Subtitle"), java.util.Map.of("pt-BR", "Excerpt here"),
                java.util.Map.of("pt-BR", List.of("Paragraph 1", "Paragraph 2")), "cover.jpg",
                NewsCategory.PRINCIPAIS, List.of("manga", "anime"),
                author, "source.com", 5, false, true
        );

        assertThat(result.getTitle().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("Breaking News");
        assertThat(result.getCategory()).isEqualTo(NewsCategory.PRINCIPAIS);
        assertThat(result.isFeatured()).isTrue();
        assertThat(result.getTags()).containsExactly("manga", "anime");
        verify(newsRepository).save(any(NewsItem.class));
    }

    @Test
    @DisplayName("Deve criar notícia com listas null tratadas como vazias")
    void deveCriarNoticiaComListasNull() {
        when(newsRepository.save(any(NewsItem.class))).thenAnswer(inv -> inv.getArgument(0));

        NewsItem result = createNewsUseCase.execute(
                java.util.Map.of("pt-BR", "Test"), null, null, null, null,
                NewsCategory.LANCAMENTOS, null, null, null, 0, false, false
        );

        assertThat(result.getContent().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEmpty();
        assertThat(result.getTags()).isEmpty();
    }
}
