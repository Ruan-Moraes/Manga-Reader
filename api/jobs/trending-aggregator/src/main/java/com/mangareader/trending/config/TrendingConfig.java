package com.mangareader.trending.config;

import java.time.Clock;

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
    TrendScoreCalculator trendScoreCalculator(TrendingProperties properties) {
        var weights = properties.weights();
        return new TrendScoreCalculator(weights.reads(), weights.libraryAdds(), weights.reviews(),
                weights.comments(), weights.releases());
    }
}
