package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.port.ChapterMemoryRepository;
import com.toonlira.translationgateway.application.port.GatewayRepository;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CleanupPersistenceUseCase {
    /** Expired chapter terms deleted per cleanup run; the rest go on the next run (they are never read once expired). */
    static final int MEMORY_BATCH = 5_000;
    private final GatewayRepository repository;
    private final ChapterMemoryRepository memory;

    public CleanupPersistenceUseCase(GatewayRepository repository) { this(repository, null); }

    @Autowired
    public CleanupPersistenceUseCase(GatewayRepository repository, ChapterMemoryRepository memory) {
        this.repository = repository;
        this.memory = memory;
    }

    @Transactional
    public Result execute(Instant now) {
        int terms = memory == null ? 0 : memory.deleteExpired(now, MEMORY_BATCH);
        return new Result(repository.deleteExpiredSessions(now), repository.deleteExpiredMetadata(now), terms);
    }

    public record Result(int sessionsDeleted, int jobsDeleted, int chapterTermsDeleted) {
        public Result(int sessionsDeleted, int jobsDeleted) { this(sessionsDeleted, jobsDeleted, 0); }
    }
}
