package com.mangareader.application.trending.usecase;

import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import java.util.List;
import org.springframework.stereotype.Service;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.trending.port.TrendingReadPort;
import com.mangareader.application.trending.port.TrendingReadPort.TrendView;
import com.mangareader.application.trending.port.TrendingReadPort.Window;
import com.mangareader.application.trending.port.TrendingReadPort.Ranking;
import com.mangareader.domain.manga.entity.Title;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GetTrendingTitlesUseCase {
    private final TrendingReadPort readPort;
    private final TitleRepositoryPort titleRepository;

    public List<TrendingTitleView> execute(Window window, Ranking ranking, int limit) {
        if (window == null || ranking == null) throw new IllegalArgumentException("window and ranking are required");
        if (limit < 1 || limit > 100) throw new IllegalArgumentException("limit must be between 1 and 100");

        List<TrendView> trends = readPort.findLatest(window, ranking, limit);
        Map<String, Title> titles = titleRepository.findByIds(
                        trends.stream().map(TrendView::titleId).toList()).stream()
                .collect(Collectors.toMap(Title::getId, Function.identity(), (first, ignored) -> first));

        return trends.stream()
                .filter(trend -> titles.containsKey(trend.titleId()))
                .map(trend -> new TrendingTitleView(titles.get(trend.titleId()), trend))
                .toList();
    }

    public record TrendingTitleView(Title title, TrendView trend) {}
}
