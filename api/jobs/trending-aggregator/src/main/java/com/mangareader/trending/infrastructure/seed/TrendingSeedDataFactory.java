package com.mangareader.trending.infrastructure.seed;

import java.time.LocalDate;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.EnumMap;
import java.util.List;

import org.springframework.stereotype.Component;

import com.mangareader.trending.domain.TrendMetrics;
import com.mangareader.trending.domain.TrendScore;
import com.mangareader.trending.domain.TrendScoreCalculator;
import com.mangareader.trending.domain.TrendSnapshot;
import com.mangareader.trending.domain.TrendWindow;

@Component
public class TrendingSeedDataFactory {
    private final TrendScoreCalculator calculator;

    public TrendingSeedDataFactory(TrendScoreCalculator calculator) {
        this.calculator = calculator;
    }

    public List<TrendSnapshot> create(List<String> titleIds, Instant calculatedAt) {
        LocalDate date = calculatedAt.atZone(ZoneOffset.UTC).toLocalDate();
        return java.util.stream.IntStream.range(0, titleIds.size())
                .mapToObj(index -> snapshot(titleIds.get(index), index, date, calculatedAt))
                .toList();
    }

    private TrendSnapshot snapshot(String titleId, int index, LocalDate date, Instant calculatedAt) {
        var scores = new EnumMap<TrendWindow, TrendScore>(TrendWindow.class);
        for (TrendWindow window : TrendWindow.values()) {
            int scale = window.days();
            long reads = (140L - index * 7L + Math.floorMod(titleId.hashCode(), 19)) * scale;
            long saves = Math.max(2, (32L - index) * scale / 2);
            long reviews = Math.max(1, (11L - index / 2) * scale / 3);
            long comments = Math.max(1, (18L - index) * scale / 3);
            long releases = window == TrendWindow.DAY ? index % 4 == 0 ? 1 : 0 : Math.max(1, scale / 7);
            var current = new TrendMetrics(reads, saves, reviews, comments, releases);

            double momentum = 0.20 + Math.floorMod(titleId.hashCode(), 35) / 100.0;
            long previousReads = Math.max(1, Math.round(reads / (1 + momentum)));
            var previous = new TrendMetrics(previousReads,
                    Math.max(1, Math.round(saves / (1 + momentum))),
                    Math.max(0, Math.round(reviews / (1 + momentum))),
                    Math.max(0, Math.round(comments / (1 + momentum))), releases);
            scores.put(window, calculator.calculate(current, previous));
        }
        return TrendSnapshot.of(titleId, date, calculatedAt, scores);
    }
}
