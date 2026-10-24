package com.toonlira.presentation.trending.mapper;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.toonlira.application.manga.service.GenreVocabulary;
import com.toonlira.application.trending.usecase.GetTrendingTitlesUseCase.TrendingTitleView;
import com.toonlira.application.trending.port.TrendingReadPort.Growth;
import com.toonlira.presentation.shared.mapper.LocalizedMappingHelper;
import com.toonlira.presentation.trending.dto.TrendingTitleResponse;
import com.toonlira.presentation.trending.dto.TrendingTitleResponse.GrowthResponse;
import com.toonlira.presentation.trending.dto.TrendingTitleResponse.MetricsResponse;
import com.toonlira.shared.domain.i18n.LocalizedString;

@Component
public class TrendingMapper {
    private final LocalizedMappingHelper i18n;
    private final GenreVocabulary genres;

    public TrendingMapper(LocalizedMappingHelper i18n, GenreVocabulary genres) {
        this.i18n = i18n;
        this.genres = genres;
    }

    public List<TrendingTitleResponse> toResponseList(List<TrendingTitleView> views) {
        Map<String, LocalizedString> vocabulary = genres.bySlug();
        return views.stream().map(view -> toResponse(view, vocabulary)).toList();
    }

    private TrendingTitleResponse toResponse(TrendingTitleView view,
            Map<String, LocalizedString> vocabulary) {
        var title = view.title();
        var trend = view.trend();
        var metrics = trend.metrics();
        var growth = trend.growth() != null ? trend.growth() : Growth.EMPTY;
        var genreSlugs = title.getGenres() != null ? title.getGenres() : List.<String>of();

        return new TrendingTitleResponse(
                title.getId(),
                i18n.toResolvedString(title.getName()),
                title.getCover(),
                title.getType(),
                genreSlugs.stream()
                        .map(slug -> vocabulary.containsKey(slug)
                                ? i18n.toResolvedString(vocabulary.get(slug)) : slug)
                        .toList(),
                trend.score(),
                trend.growthPercent(),
                new MetricsResponse(metrics.reads(), metrics.libraryAdds(), metrics.reviews(),
                        metrics.comments(), metrics.releases()),
                new GrowthResponse(growth.reads(), growth.libraryAdds(), growth.reviews(),
                        growth.comments(), growth.releases()),
                trend.calculatedAt());
    }
}
