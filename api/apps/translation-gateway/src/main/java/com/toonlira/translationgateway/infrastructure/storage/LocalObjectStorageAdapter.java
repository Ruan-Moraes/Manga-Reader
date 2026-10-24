package com.toonlira.translationgateway.infrastructure.storage;

import static com.toonlira.translationgateway.domain.GatewayErrorCode.STORAGE_UNAVAILABLE;

import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.OriginalObjectKey;
import com.toonlira.translationgateway.domain.rendering.ResultObjectKey;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.NoSuchFileException;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.nio.file.attribute.PosixFilePermission;
import java.time.Instant;
import java.util.Set;
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
        try { OriginalObjectKey.validateForStore(objectKey, createdAt); ResultObjectKey.validateForStore(objectKey, createdAt); }
        catch (IllegalArgumentException invalid) { throw new GatewayException(STORAGE_UNAVAILABLE, 503, true); }
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
    public InputStream open(String objectKey) {
        try { return Files.newInputStream(resolve(objectKey)); }
        catch (IOException error) { throw new GatewayException(STORAGE_UNAVAILABLE, 503, true); }
    }

    @Override
    public void delete(String objectKey) {
        try {
            Files.deleteIfExists(resolve(objectKey));
        } catch (IOException error) {
            throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
        }
    }

    @Override
    public int deleteOlderThan(Instant cutoff) {
        return sweep("private/", cutoff, (key, created) -> created);
    }

    @Override
    public int deleteExpiredOriginals(Instant now) {
        return sweep(OriginalObjectKey.PREFIX, now, (key, created) -> {
            var bound = created.plusSeconds(OriginalObjectKey.MAX_RETENTION_SECONDS);
            var expiry = OriginalObjectKey.expiry(key).orElse(bound);
            return expiry.isBefore(bound) ? expiry : bound;
        });
    }

    private Path resolve(String objectKey) {
        var resolved = root.resolve(objectKey).normalize();
        if (!resolved.startsWith(root)) throw new GatewayException(STORAGE_UNAVAILABLE, 503, false);
        var cursor = root;
        if (Files.isSymbolicLink(cursor)) throw new GatewayException(STORAGE_UNAVAILABLE, 503, false);
        for (var component : root.relativize(resolved)) {
            cursor = cursor.resolve(component);
            if (Files.isSymbolicLink(cursor)) throw new GatewayException(STORAGE_UNAVAILABLE, 503, false);
        }
        return resolved;
    }

    @Override
    public int deleteExpiredResults(Instant now) {
        return sweep(ResultObjectKey.PREFIX, now, (key, created) -> {
            var bound = created.plusSeconds(3600);
            var expiry = ResultObjectKey.expiry(key).orElse(bound);
            return expiry.isBefore(bound) ? expiry : bound;
        });
    }

    private int sweep(String prefix, Instant cutoff, ExpiryRule expiryRule) {
        var directory = resolve(prefix);
        try {
            if (!Files.readAttributes(directory, BasicFileAttributes.class, LinkOption.NOFOLLOW_LINKS).isDirectory()) {
                throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
            }
        } catch (NoSuchFileException absent) { return 0; }
        catch (IOException unavailable) { throw new GatewayException(STORAGE_UNAVAILABLE, 503, true); }
        int deleted = 0;
        boolean failed = false;
        try (var paths = Files.walk(directory)) {
            var candidates = paths.filter(path -> Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS)).iterator();
            while (candidates.hasNext()) {
                var path = candidates.next();
                try {
                    var key = root.relativize(path).toString().replace(path.getFileSystem().getSeparator(), "/");
                    var created = Files.getLastModifiedTime(path, LinkOption.NOFOLLOW_LINKS).toInstant();
                    if (!expiryRule.deadline(key, created).isAfter(cutoff) && Files.deleteIfExists(resolve(key))) deleted++;
                } catch (IOException | RuntimeException unavailable) { failed = true; }
            }
        } catch (IOException | RuntimeException unavailable) { throw new GatewayException(STORAGE_UNAVAILABLE, 503, true); }
        if (failed) throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
        return deleted;
    }

    @FunctionalInterface
    private interface ExpiryRule { Instant deadline(String key, Instant created); }
}
