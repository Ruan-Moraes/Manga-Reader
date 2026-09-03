package com.mangareader.trending.config;

import java.time.ZoneId;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

@Validated
@ConfigurationProperties("trending")
public record TrendingProperties(@Valid @NotNull Seed seed, @Valid @NotNull Schedule schedule,
        @NotNull ZoneId zone, @Positive long retentionDays, @Valid @NotNull Weights weights,
        @Valid @NotNull Admin admin) {
    public record Seed(boolean enabled) {}
    public record Schedule(String cron) {}
    public record Weights(@PositiveOrZero double reads, @PositiveOrZero double libraryAdds,
            @PositiveOrZero double reviews, @PositiveOrZero double comments,
            @PositiveOrZero double releases) {}
    public record Admin(String token) {}

    @AssertTrue(message = "trending.schedule.cron must be valid")
    public boolean isCronValid() {
        return schedule != null && schedule.cron() != null && CronExpression.isValidExpression(schedule.cron());
    }

    @AssertTrue(message = "trending weights must sum to 1")
    public boolean areWeightsNormalized() {
        if (weights == null) return false;
        double sum = weights.reads() + weights.libraryAdds() + weights.reviews()
                + weights.comments() + weights.releases();
        return Math.abs(sum - 1.0) < 0.000_001;
    }
}
