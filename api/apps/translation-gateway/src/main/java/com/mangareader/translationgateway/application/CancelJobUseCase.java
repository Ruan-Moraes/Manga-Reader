package com.mangareader.translationgateway.application;

import com.mangareader.translationgateway.application.port.GatewayRepository;
import com.mangareader.translationgateway.domain.ProcessingJob;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CancelJobUseCase {
    private final GatewayRepository repository;
    private final Clock clock;

    public CancelJobUseCase(GatewayRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional
    public ProcessingJob execute(UUID installationId, UUID jobRef) {
        return repository.cancel(installationId, jobRef, Instant.now(clock));
    }
}
