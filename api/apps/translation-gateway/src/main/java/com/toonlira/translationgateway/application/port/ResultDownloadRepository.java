package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.rendering.ReadyResultReference;
import java.util.Optional;
import java.util.UUID;

/** Owner-scoped, short locking projection; called only within a transaction. */
public interface ResultDownloadRepository {
    Optional<ReadyResultReference> findReady(UUID installationId, UUID jobRef);
}
