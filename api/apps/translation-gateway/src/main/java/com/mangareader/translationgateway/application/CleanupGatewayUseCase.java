package com.mangareader.translationgateway.application;

import com.mangareader.translationgateway.application.port.ObjectStoragePort;
import java.time.Clock;
import java.time.Instant;
import org.springframework.stereotype.Service;

@Service
public class CleanupGatewayUseCase {
    private final CleanupPersistenceUseCase persistence;
    private final ObjectStoragePort storage;
    private final Clock clock;

    public CleanupGatewayUseCase(CleanupPersistenceUseCase persistence, ObjectStoragePort storage, Clock clock) {
        this.persistence = persistence;
        this.storage = storage;
        this.clock = clock;
    }

    public Result execute() {
        var now = Instant.now(clock);
        int objects = 0;
        RuntimeException storageFailure = null;
        try {
            objects = storage.deleteOlderThan(now.minusSeconds(3600));
        } catch (RuntimeException error) {
            storageFailure = error;
        }
        var database = persistence.execute(now);
        if (storageFailure != null) throw storageFailure;
        return new Result(objects, database.sessionsDeleted(), database.jobsDeleted());
    }

    public record Result(int objectsDeleted, int sessionsDeleted, int jobsDeleted) { }
}
