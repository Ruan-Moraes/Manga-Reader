package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

@Service
public class AcknowledgeResultUseCase {
    private final ResultAcknowledgementPersistenceUseCase persistence;
    private final CleanupAcknowledgedResultsUseCase cleanup;
    private final Clock clock;

    public AcknowledgeResultUseCase(ResultAcknowledgementPersistenceUseCase persistence,
                                    CleanupAcknowledgedResultsUseCase cleanup, Clock clock) {
        this.persistence = persistence;
        this.cleanup = cleanup;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void execute(UUID installationId, UUID jobRef) {
        persistence.request(installationId, jobRef, Instant.now(clock));
        if (!cleanup.executeForJob(installationId, jobRef)) {
            throw new GatewayException(GatewayErrorCode.STORAGE_UNAVAILABLE, 503, true);
        }
    }
}
