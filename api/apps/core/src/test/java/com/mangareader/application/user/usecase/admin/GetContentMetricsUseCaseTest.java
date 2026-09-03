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
import com.mangareader.application.manga.port.TitleRatingAggregateReadPort;
import com.mangareader.application.manga.port.TitleRatingAggregateReadPort.TitleRatingAggregateView;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.event.valueobject.EventStatus;
import com.mangareader.domain.manga.entity.Title;

@ExtendWith(MockitoExtension.class)
@DisplayName("GetContentMetricsUseCase")
class GetContentMetricsUseCaseTest {

    @Mock
    private TitleRepositoryPort titleRepository;

    @Mock
    private TitleRatingAggregateReadPort ratingAggregateReadPort;

    @Mock
    private EventRepositoryPort eventRepository;

    @Mock
    private com.mangareader.shared.application.i18n.LocaleResolutionService localeResolutionService;

    @InjectMocks
    private GetContentMetricsUseCase useCase;

    @Test
    @DisplayName("Deve agregar contagem de títulos por status")
    void deveAgregarContagemDeTitulosPorStatus() {
        when(titleRepository.countByStatus(any())).thenReturn(10L);
        when(eventRepository.countByStatus(any(EventStatus.class))).thenReturn(5L);
        when(ratingAggregateReadPort.findTop(10)).thenReturn(List.of());

        var result = useCase.execute();

        assertThat(result.titlesByStatus()).containsKeys("ONGOING", "COMPLETED", "HIATUS", "CANCELLED");
        assertThat(result.titlesByStatus().get("ONGOING")).isEqualTo(10L);
    }

    @Test
    @DisplayName("Deve retornar top títulos com nota vinda do agregado")
    void deveRetornarTopTitulos() {
        Title title = Title.builder()
                .id("t1")
                .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Top Manga"))
                .cover("cover.jpg")
                .type("MANGA")
                .build();
        var view = new TitleRatingAggregateView("t1", 4.8, 100, 0, 0, 0, 0, 0);

        when(titleRepository.countByStatus(any())).thenReturn(0L);
        when(eventRepository.countByStatus(any(EventStatus.class))).thenReturn(0L);
        when(ratingAggregateReadPort.findTop(10)).thenReturn(List.of(view));
        when(titleRepository.findByIds(List.of("t1"))).thenReturn(List.of(title));
        when(localeResolutionService.resolve(any(com.mangareader.shared.domain.i18n.LocalizedString.class))).thenReturn("Top Manga");

        var result = useCase.execute();

        assertThat(result.topTitles()).hasSize(1);
        assertThat(result.topTitles().getFirst().name()).isEqualTo("Top Manga");
        assertThat(result.topTitles().getFirst().ratingAverage()).isEqualTo(4.8);
        assertThat(result.topTitles().getFirst().ratingCount()).isEqualTo(100L);
    }
}
