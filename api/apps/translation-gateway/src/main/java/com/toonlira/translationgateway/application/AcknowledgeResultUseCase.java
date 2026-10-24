package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.port.ResultAcknowledgementRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AcknowledgeResultUseCase {
    private final ResultAcknowledgementRepository repository;
    private final Clock clock;

    public AcknowledgeResultUseCase(ResultAcknowledgementRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional
    public void execute(UUID installationId, UUID jobRef) {
        repository.request(installationId, jobRef, Instant.now(clock));
    }
}
