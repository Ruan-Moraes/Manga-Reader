package com.mangareader.reconciler.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

@Validated
@ConfigurationProperties("reconciler")
public record ReconcilerProperties(@Valid @NotNull Reconciliation reconciliation,
        @Valid @NotNull Orphan orphan, @Valid @NotNull Admin admin) {
    public record Reconciliation(String cron) {}
    public record Orphan(String cron) {}
    public record Admin(String token) {}

    @AssertTrue(message = "reconciler cron expressions must be valid")
    public boolean areCronsValid() {
        return reconciliation != null && orphan != null
                && reconciliation.cron() != null && orphan.cron() != null
                && CronExpression.isValidExpression(reconciliation.cron())
                && CronExpression.isValidExpression(orphan.cron());
    }
}
