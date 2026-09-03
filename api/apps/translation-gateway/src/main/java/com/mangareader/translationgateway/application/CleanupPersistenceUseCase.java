package com.mangareader.translationgateway.application;

import com.mangareader.translationgateway.application.port.GatewayRepository;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CleanupPersistenceUseCase {
    private final GatewayRepository repository;

    public CleanupPersistenceUseCase(GatewayRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public Result execute(Instant now) {
        return new Result(repository.deleteExpiredSessions(now), repository.deleteExpiredMetadata(now));
    }

    public record Result(int sessionsDeleted, int jobsDeleted) { }
}
