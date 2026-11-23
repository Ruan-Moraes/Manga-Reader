package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.ResultAcknowledgementRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ResultExpirationUseCase {
    private static final int MAX_RETENTION_SECONDS = 3600;
    private static final int BATCH_SIZE = 100;
    private final ResultAcknowledgementRepository repository;
    private final GatewayProperties properties;
    private final Clock clock;

    public ResultExpirationUseCase(ResultAcknowledgementRepository repository, GatewayProperties properties, Clock clock) {
        this.repository = repository;
        this.properties = properties;
        this.clock = clock;
    }

    @Transactional
    public void expire(UUID installationId, UUID jobRef) {
        if (installationId == null || jobRef == null) throw new IllegalArgumentException("Invalid expiration lookup");
        var now = Instant.now(clock);
        repository.expire(installationId, jobRef, now, cutoff(now));
    }

    @Transactional
    public int execute() {
        var now = Instant.now(clock);
        return repository.expireBatch(BATCH_SIZE, now, cutoff(now));
    }

    private Instant cutoff(Instant now) {
        int configured = properties.getDisclosure().getResultRetentionSeconds();
        int seconds = configured > 0 && configured <= MAX_RETENTION_SECONDS ? configured : 0;
        return now.minusSeconds(seconds);
    }
}
