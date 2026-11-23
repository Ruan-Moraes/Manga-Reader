package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class CleanupGatewayUseCase {
    private final CleanupPersistenceUseCase persistence;
    private final ObjectStoragePort storage;
    private final OcrPersistenceUseCase ocrPersistence;
    private final TranslationPersistenceUseCase translationPersistence;
    private final RenderingPersistenceUseCase renderingPersistence;
    private final CleanupAcknowledgedResultsUseCase acknowledgedResults;
    private final ResultExpirationUseCase expiration;
    private final CleanupLifecycleObjectsUseCase lifecycle;
    private final Clock clock;
    private final OriginalExpirationUseCase originals;

    public CleanupGatewayUseCase(CleanupPersistenceUseCase persistence, ObjectStoragePort storage,
                                 OcrPersistenceUseCase ocrPersistence,
                                 TranslationPersistenceUseCase translationPersistence,
                                 RenderingPersistenceUseCase renderingPersistence,
                                 CleanupAcknowledgedResultsUseCase acknowledgedResults,
                                 ResultExpirationUseCase expiration, CleanupLifecycleObjectsUseCase lifecycle, Clock clock) {
        this(persistence, storage, ocrPersistence, translationPersistence, renderingPersistence, acknowledgedResults,
            expiration, lifecycle, clock, null);
    }

    @Autowired
    public CleanupGatewayUseCase(CleanupPersistenceUseCase persistence, ObjectStoragePort storage,
                                 OcrPersistenceUseCase ocrPersistence, TranslationPersistenceUseCase translationPersistence,
                                 RenderingPersistenceUseCase renderingPersistence, CleanupAcknowledgedResultsUseCase acknowledgedResults,
                                 ResultExpirationUseCase expiration, CleanupLifecycleObjectsUseCase lifecycle, Clock clock,
                                 OriginalExpirationUseCase originals) {
        this.persistence = persistence;
        this.storage = storage;
        this.ocrPersistence = ocrPersistence;
        this.translationPersistence = translationPersistence;
        this.renderingPersistence = renderingPersistence;
        this.acknowledgedResults = acknowledgedResults;
        this.expiration = expiration;
        this.lifecycle = lifecycle;
        this.clock = clock;
        this.originals = originals;
    }

    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public Result execute() {
        var now = Instant.now(clock);
        boolean databaseFailure = false;
        boolean storageFailure = false;
        for (Runnable phase : List.<Runnable>of(
            () -> { if (originals != null) originals.execute(); },
            () -> ocrPersistence.failStale(now.minusSeconds(900), now, 100),
            () -> translationPersistence.failStale(now.minusSeconds(900), now, 100),
            () -> renderingPersistence.failStale(now.minusSeconds(900), now, 100),
            expiration::execute)) {
            try { phase.run(); } catch (RuntimeException unavailable) { databaseFailure = true; }
        }
        try { storageFailure = lifecycle.execute().deferred() > 0; }
        catch (RuntimeException unavailable) { databaseFailure = true; }
        try { storageFailure |= acknowledgedResults.execute().deferred() > 0; }
        catch (RuntimeException unavailable) { databaseFailure = true; }
        int objects = 0;
        try { objects = storage.deleteExpiredOriginals(now); }
        catch (RuntimeException unavailable) { storageFailure = true; }
        try { objects += storage.deleteExpiredResults(now); }
        catch (RuntimeException unavailable) { storageFailure = true; }
        try {
            objects += storage.deleteOlderThan(now.minusSeconds(3600));
        } catch (RuntimeException unavailable) {
            storageFailure = true;
        }
        CleanupPersistenceUseCase.Result database = null;
        try { database = persistence.execute(now); }
        catch (RuntimeException unavailable) { databaseFailure = true; }
        if (storageFailure) throw new GatewayException(GatewayErrorCode.STORAGE_UNAVAILABLE, 503, true);
        if (databaseFailure) throw new GatewayException(GatewayErrorCode.INTERNAL_ERROR, 503, true);
        return new Result(objects, database.sessionsDeleted(), database.jobsDeleted());
    }

    public record Result(int objectsDeleted, int sessionsDeleted, int jobsDeleted) { }
}
