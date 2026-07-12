package com.mangareader.trending.config;

import java.time.Clock;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.mangareader.trending.domain.TrendScoreCalculator;

@Configuration(proxyBeanMethods = false)
public class TrendingConfig {
    @Bean
    Clock trendingClock() {
        return Clock.systemUTC();
    }

    @Bean
    TrendScoreCalculator trendScoreCalculator(
            @Value("${trending.weights.reads}") double reads,
            @Value("${trending.weights.library-adds}") double libraryAdds,
            @Value("${trending.weights.reviews}") double reviews,
            @Value("${trending.weights.comments}") double comments,
            @Value("${trending.weights.releases}") double releases) {
        return new TrendScoreCalculator(reads, libraryAdds, reviews, comments, releases);
    }
}
