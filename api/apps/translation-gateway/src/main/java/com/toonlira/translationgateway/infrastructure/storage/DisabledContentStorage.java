package com.toonlira.translationgateway.infrastructure.storage;

import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import java.io.InputStream;
import java.nio.file.Path;
import java.time.Instant;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/** Prevents legacy content services from obtaining a filesystem or bucket in the volatile profile. */
@Component
@ConditionalOnProperty(name = "gateway.storage.mode", havingValue = "disabled")
public class DisabledContentStorage implements ObjectStoragePort {
    @Override public void store(String key, Path source, String mime, String hash, Instant created) { throw retired(); }
    @Override public InputStream open(String key) { throw retired(); }
    @Override public void delete(String key) { throw retired(); }
    @Override public int deleteOlderThan(Instant cutoff) { throw retired(); }
    @Override public int deleteExpiredOriginals(Instant now) { throw retired(); }
    @Override public int deleteExpiredResults(Instant now) { throw retired(); }
    private static GatewayException retired() { return new GatewayException(GatewayErrorCode.STORAGE_UNAVAILABLE, 410, false); }
}
