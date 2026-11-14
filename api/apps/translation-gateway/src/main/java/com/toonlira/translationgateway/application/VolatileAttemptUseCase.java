package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.VolatileAttemptRepository;
import com.toonlira.translationgateway.domain.VolatileIdempotencyKey;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VolatileAttemptUseCase {
    private final VolatileAttemptRepository repository;
    private final GatewayProperties properties;
    private final Clock clock;
    public VolatileAttemptUseCase(VolatileAttemptRepository repository, GatewayProperties properties, Clock clock) {
        this.repository = repository; this.properties = properties; this.clock = clock;
    }
    @Transactional(readOnly = true)
    public Optional<VolatileAttemptRepository.Receipt> find(UUID installation, UUID key) {
        return VolatileIdempotencyKey.active(key, Instant.now(clock)) ? repository.find(installation, key) : Optional.empty();
    }
    public void requireActive(UUID key) {
        if (!VolatileIdempotencyKey.active(key, Instant.now(clock)))
            throw new GatewayException(GatewayErrorCode.JOB_STATE_CONFLICT, 409, false);
    }
    @Transactional
    public VolatileAttemptRepository.Receipt reserve(UUID installation, UUID key) {
        requireActive(key);
        var budget = properties.getTestBudget();
        boolean unmetered = budget.isEnabled() && budget.isUnmetered();
        return repository.reserve(installation, key, UUID.randomUUID(), Instant.now(clock),
            unmetered ? 0 : properties.getInstallationDailyQuota(), unmetered ? 0 : properties.getGlobalDailyQuota());
    }
    @Transactional
    public void finish(UUID operation, VolatileAttemptRepository.Status status, String error) {
        repository.finish(operation, status, error, Instant.now(clock));
    }
    @Transactional
    public int purgeExpired() { return repository.deleteExpired(Instant.now(clock).minus(VolatileIdempotencyKey.VALIDITY), 1000); }
}
