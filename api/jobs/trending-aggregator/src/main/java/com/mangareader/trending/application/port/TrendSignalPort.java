package com.mangareader.trending.application.port;

import java.time.LocalDateTime;
import java.util.Map;

import com.mangareader.trending.domain.TrendMetrics;

public interface TrendSignalPort {
    Map<String, TrendMetrics> read(LocalDateTime fromInclusive, LocalDateTime toExclusive);
}
