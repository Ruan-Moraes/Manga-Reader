package com.toonlira.translationgateway.infrastructure.storage;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.domain.OriginalObjectKey;
import com.toonlira.translationgateway.domain.rendering.ResultObjectKey;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Instant;

/** Test-only seeding for historical metadata/cleanup algorithms. Never a production storage adapter. */
public final class LegacyStorageFixture extends LocalObjectStorageAdapter {
    private final Path root;
    public LegacyStorageFixture(GatewayProperties properties) {
        super(properties); root = properties.getStorage().getLocalDirectory().toAbsolutePath().normalize();
    }
    @Override public void store(String key, Path source, String mime, String hash, Instant created) {
        OriginalObjectKey.validateForStore(key, created); ResultObjectKey.validateForStore(key, created);
        var target = root.resolve(key).normalize();
        if (!key.startsWith("private/") || !target.startsWith(root)) throw new IllegalArgumentException("Invalid fixture key");
        try {
            Files.createDirectories(target.getParent()); Files.copy(source, target);
            Files.setLastModifiedTime(target, FileTime.from(created));
        } catch (IOException error) { throw new IllegalStateException("Legacy fixture could not be seeded"); }
    }
}
