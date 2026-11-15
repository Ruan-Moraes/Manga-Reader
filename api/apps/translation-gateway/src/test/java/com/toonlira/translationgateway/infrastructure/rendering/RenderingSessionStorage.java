package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import java.io.InputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.time.Instant;

/** Register exact keys with the parent before starting any remotely ambiguous write. */
final class RenderingSessionStorage implements ObjectStoragePort {
    private final ObjectStoragePort delegate;
    RenderingSessionStorage(ObjectStoragePort delegate) { this.delegate = delegate; }
    @Override public void store(String key, Path source, String mime, String hash, Instant created) {
        try {
            RenderingSessionProtocol.write(System.out, new RenderingSessionProtocol.Request("REGISTER", null, null, key));
            if (!RenderingSessionProtocol.read(System.in, RenderingSessionProtocol.Reply.class).accepted())
                throw new IOException("session-upload-rejected");
        } catch (IOException unavailable) { throw new RenderFileException(RenderFileException.Failure.UNAVAILABLE); }
        delegate.store(key, source, mime, hash, created);
    }
    @Override public InputStream open(String key) { return delegate.open(key); }
    @Override public void delete(String key) { delegate.delete(key); }
    @Override public int deleteOlderThan(Instant cutoff) { throw new UnsupportedOperationException(); }
}
