package com.mangareader.application.user.usecase.admin;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.event.port.EventRepositoryPort;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.domain.manga.entity.Title;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetContentMetricsUseCase")
class GetContentMetricsUseCaseTest {

    @Mock
    private TitleRepositoryPort titleRepository;

    @Mock
    private EventRepositoryPort eventRepository;

    @InjectMocks
    private GetContentMetricsUseCase useCase;

    @Test
    @DisplayName("Deve agregar contagem de títulos por status")
    void deveAgregarContagemDeTitulosPorStatus() {
        when(titleRepository.countByStatus(any())).thenReturn(10L);
        when(eventRepository.countByStatus(any(EventStatus.class))).thenReturn(5L);
        when(titleRepository.findTopByRankingScore(10)).thenReturn(List.of());

        var result = useCase.execute();

        assertThat(result.titlesByStatus()).containsKeys("ONGOING", "COMPLETED", "HIATUS", "CANCELLED");
        assertThat(result.titlesByStatus().get("ONGOING")).isEqualTo(10L);
    }

    @Test
    @DisplayName("Deve retornar top 10 títulos com dados mapeados")
    void deveRetornarTopTitulos() {
        Title title = Title.builder()
                .id("t1")
                .name("Top Manga")
                .cover("cover.jpg")
                .type("MANGA")
                .rankingScore(9.5)
                .ratingAverage(4.8)
                .ratingCount(100L)
                .build();

        when(titleRepository.countByStatus(any())).thenReturn(0L);
        when(eventRepository.countByStatus(any(EventStatus.class))).thenReturn(0L);
        when(titleRepository.findTopByRankingScore(10)).thenReturn(List.of(title));

        var result = useCase.execute();

        assertThat(result.topTitles()).hasSize(1);
        assertThat(result.topTitles().getFirst().name()).isEqualTo("Top Manga");
        assertThat(result.topTitles().getFirst().rankingScore()).isEqualTo(9.5);
    }
}
