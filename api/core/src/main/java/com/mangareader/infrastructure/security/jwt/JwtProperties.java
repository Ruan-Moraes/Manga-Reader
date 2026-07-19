package com.mangareader.infrastructure.security.jwt;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

@Validated
@ConfigurationProperties("app.jwt")
public record JwtProperties(
        @NotBlank @Size(min = 32) String secret,
        @Positive long accessTokenExpiration,
        @Positive long refreshTokenExpiration,
        @Positive long passwordResetExpiration,
        @NotBlank String cleanupCron,
        @Positive long revokedRetentionDays) {

    @AssertTrue(message = "app.jwt.cleanup-cron must be a valid Spring cron expression")
    public boolean isCleanupCronValid() {
        return cleanupCron != null && CronExpression.isValidExpression(cleanupCron);
    }
}
