package com.mangareader.aggregator.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

@Validated
@ConfigurationProperties("aggregator")
public record AggregatorProperties(@Valid @NotNull Reconciliation reconciliation,
        @Valid @NotNull Admin admin) {
    public record Reconciliation(String cron) {}
    public record Admin(String token) {}

    @AssertTrue(message = "aggregator.reconciliation.cron must be valid")
    public boolean isCronValid() {
        return reconciliation != null && reconciliation.cron() != null
                && CronExpression.isValidExpression(reconciliation.cron());
    }
}
