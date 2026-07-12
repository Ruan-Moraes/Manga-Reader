package com.mangareader.trending.application;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.List;

import org.springframework.stereotype.Service;

import com.mangareader.trending.application.port.TrendSignalPort;
import com.mangareader.trending.application.port.TrendSnapshotPort;
import com.mangareader.trending.domain.TrendMetrics;
import com.mangareader.trending.domain.TrendScore;
import com.mangareader.trending.domain.TrendScoreCalculator;
import com.mangareader.trending.domain.TrendSnapshot;
import com.mangareader.trending.domain.TrendWindow;

@Service
public class RecalculateTrendingUseCase {
    private final TrendSignalPort signalReader;
    private final TrendSnapshotPort snapshots;
    private final TrendScoreCalculator calculator;
    private final Clock clock;

    public RecalculateTrendingUseCase(TrendSignalPort signalReader, TrendSnapshotPort snapshots,
            TrendScoreCalculator calculator, Clock clock) {
        this.signalReader = signalReader;
        this.snapshots = snapshots;
        this.calculator = calculator;
        this.clock = clock;
    }

    public int execute() {
        LocalDate date = LocalDate.now(clock);
        LocalDateTime currentTo = date.atStartOfDay();
        var scoresByTitle = new java.util.HashMap<String, EnumMap<TrendWindow, TrendScore>>();
        for (TrendWindow window : TrendWindow.values()) {
            LocalDateTime currentFrom = currentTo.minusDays(window.days());
            LocalDateTime previousFrom = currentFrom.minusDays(window.days());
            var current = signalReader.read(currentFrom, currentTo);
            var previous = signalReader.read(previousFrom, currentFrom);
            var titleIds = new HashSet<>(current.keySet());
            titleIds.addAll(previous.keySet());
            titleIds.forEach(titleId -> scoresByTitle
                    .computeIfAbsent(titleId, ignored -> new EnumMap<>(TrendWindow.class))
                    .put(window, calculator.calculate(current.getOrDefault(titleId, TrendMetrics.EMPTY),
                            previous.getOrDefault(titleId, TrendMetrics.EMPTY))));
        }
        List<TrendSnapshot> result = new ArrayList<>();
        var calculatedAt = clock.instant();
        scoresByTitle.forEach((titleId, scores) -> result.add(TrendSnapshot.of(titleId, date, calculatedAt, scores)));
        snapshots.replace(date, result);
        return result.size();
    }
}
