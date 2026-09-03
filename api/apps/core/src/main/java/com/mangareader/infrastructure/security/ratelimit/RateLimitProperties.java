package com.mangareader.infrastructure.security.ratelimit;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Validated
@ConfigurationProperties("app.rate-limit")
public record RateLimitProperties(
        @Valid @NotNull Policy general,
        @Valid @NotNull Policy auth,
        @NotNull List<String> trustedProxies) {

    public record Policy(@Min(1) long capacity, @NotNull Duration window) {}
}
