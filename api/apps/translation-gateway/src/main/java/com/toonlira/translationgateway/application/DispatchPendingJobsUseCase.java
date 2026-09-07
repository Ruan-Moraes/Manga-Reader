package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.port.TaskDispatchPort;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import java.time.Clock;
import java.time.Instant;
import org.springframework.stereotype.Service;

@Service
public class DispatchPendingJobsUseCase {
    private final DispatchPersistenceUseCase persistence;
    private final TaskDispatchPort taskDispatch;
    private final GatewayProperties properties;
    private final Clock clock;

    public DispatchPendingJobsUseCase(DispatchPersistenceUseCase persistence, TaskDispatchPort taskDispatch,
                                      GatewayProperties properties, Clock clock) {
        this.persistence = persistence;
        this.taskDispatch = taskDispatch;
        this.properties = properties;
        this.clock = clock;
    }

    public int execute() {
        var now = Instant.now(clock);
        var claims = persistence.claim(properties.getDispatch().getBatchSize(), now, now.plusSeconds(60));
        for (var claim : claims) {
            try {
                taskDispatch.dispatch(claim.jobRef());
                persistence.complete(claim.jobId(), Instant.now(clock));
            } catch (RuntimeException error) {
                persistence.fail(claim.jobId(), claim.attemptCount(), properties.getDispatch().getMaxAttempts(), Instant.now(clock));
            }
        }
        return claims.size();
    }

    public void dispatchBestEffort() {
        try { execute(); } catch (RuntimeException ignored) { }
    }
}
