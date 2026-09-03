package com.mangareader.translationgateway.infrastructure.storage;

import static com.mangareader.translationgateway.domain.GatewayErrorCode.STORAGE_UNAVAILABLE;

import com.mangareader.translationgateway.application.port.ObjectStoragePort;
import com.mangareader.translationgateway.domain.GatewayException;
import com.mangareader.translationgateway.application.config.GatewayProperties;
import java.io.IOException;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.nio.file.attribute.PosixFilePermission;
import java.time.Instant;
import java.util.Set;
import java.util.stream.Stream;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "gateway.storage", name = "mode", havingValue = "local", matchIfMissing = true)
public class LocalObjectStorageAdapter implements ObjectStoragePort {
    private final Path root;

    public LocalObjectStorageAdapter(GatewayProperties properties) {
        this.root = properties.getStorage().getLocalDirectory().toAbsolutePath().normalize();
    }

    @Override
    public void store(String objectKey, Path source, String mimeType, String sha256, Instant createdAt) {
        var target = resolve(objectKey);
        try {
            Files.createDirectories(target.getParent());
            Files.copy(source, target);
            try {
                Files.setPosixFilePermissions(target, Set.of(PosixFilePermission.OWNER_READ, PosixFilePermission.OWNER_WRITE));
            } catch (UnsupportedOperationException ignored) { }
            Files.setLastModifiedTime(target, FileTime.from(createdAt));
        } catch (FileAlreadyExistsException conflict) {
            throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
        } catch (IOException error) {
            throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
        }
    }

    @Override
    public void delete(String objectKey) {
        try {
            Files.deleteIfExists(resolve(objectKey));
        } catch (IOException ignored) { }
    }

    @Override
    public int deleteOlderThan(Instant cutoff) {
        if (!Files.exists(root)) return 0;
        try (Stream<Path> paths = Files.walk(root)) {
            var candidates = paths.filter(Files::isRegularFile).filter(path -> olderThan(path, cutoff)).toList();
            candidates.forEach(path -> {
                try { Files.deleteIfExists(path); } catch (IOException ignored) { }
            });
            return candidates.size();
        } catch (IOException error) {
            throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
        }
    }

    private boolean olderThan(Path path, Instant cutoff) {
        try { return Files.getLastModifiedTime(path).toInstant().isBefore(cutoff); }
        catch (IOException error) { return false; }
    }

    private Path resolve(String objectKey) {
        var resolved = root.resolve(objectKey).normalize();
        if (!resolved.startsWith(root)) throw new GatewayException(STORAGE_UNAVAILABLE, 503, false);
        return resolved;
    }
}
