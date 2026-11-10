package com.toonlira.translationgateway.infrastructure.rendering;

import java.io.IOException;
import java.nio.channels.FileChannel;
import java.nio.channels.FileLock;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.Set;

/** Lifetime parent lock plus per-child locks prevent restart from reclaiming a live orphan. */
final class RenderingSessionDirectory {
    private static final Map<Path, RenderingSessionDirectory> OWNERS = new HashMap<>();
    private final Path root;
    private final FileChannel channel;
    private final FileLock lock;
    private final Object rootIdentity;
    private final Object lockIdentity;
    private RenderingSessionDirectory(Path parent) throws IOException {
        root = parent.resolve("render-sessions-v1");
        if (!Files.exists(root, LinkOption.NOFOLLOW_LINKS)) Files.createDirectory(root,
            PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rwx------")));
        if (!Files.isDirectory(root, LinkOption.NOFOLLOW_LINKS)
            || !Files.getPosixFilePermissions(root).equals(PosixFilePermissions.fromString("rwx------")))
            throw new IOException("session-root-unavailable");
        rootIdentity = identity(root, true);
        channel = FileChannel.open(root.resolve(".owner.lock"), Set.of(StandardOpenOption.CREATE, StandardOpenOption.WRITE,
            LinkOption.NOFOLLOW_LINKS), PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")));
        FileLock acquired = null;
        try {
            acquired = channel.tryLock();
            if (acquired == null) throw new IOException("session-owner-busy");
            lock = acquired;
            lockIdentity = identity(root.resolve(".owner.lock"), false);
        } catch (IOException | RuntimeException error) { channel.close(); throw error; }
    }
    static synchronized Path create(Path parent) throws IOException {
        var real = parent.toRealPath();
        var owner = OWNERS.get(real);
        if (owner == null) { owner = new RenderingSessionDirectory(real); OWNERS.put(real, owner); }
        if (!owner.lock.isValid() || !owner.rootIdentity.equals(identity(owner.root, true))
            || !owner.lockIdentity.equals(identity(owner.root.resolve(".owner.lock"), false))) throw new IOException("session-owner-unavailable");
        owner.recover();
        var directory = Files.createDirectory(owner.root.resolve("session-" + UUID.randomUUID()),
            PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rwx------")));
        Files.createFile(directory.resolve(".owner.lock"),
            PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")));
        return directory;
    }
    private static Object identity(Path path, boolean directory) throws IOException {
        var attributes = Files.readAttributes(path, BasicFileAttributes.class, LinkOption.NOFOLLOW_LINKS);
        if (attributes.fileKey() == null || (directory ? !attributes.isDirectory() : !attributes.isRegularFile()))
            throw new IOException("session-identity-unavailable");
        return attributes.fileKey();
    }
    private void recover() throws IOException {
        int count = 0;
        try (var entries = Files.newDirectoryStream(root)) {
            for (var entry : entries) {
                if (entry.getFileName().toString().equals(".owner.lock")) continue;
                if (++count > 64 || !entry.getFileName().toString().matches("session-[0-9a-f-]{36}")
                    || !Files.isDirectory(entry, LinkOption.NOFOLLOW_LINKS)) throw new IOException("session-recovery-unavailable");
                var marker = entry.resolve(".owner.lock");
                if (!Files.isRegularFile(marker, LinkOption.NOFOLLOW_LINKS)) throw new IOException("session-owner-unavailable");
                try (var candidate = FileChannel.open(marker, StandardOpenOption.WRITE, LinkOption.NOFOLLOW_LINKS);
                     var acquired = candidate.tryLock()) {
                    if (acquired == null) throw new IOException("session-child-active");
                    try (var paths = Files.walk(entry)) {
                        if (paths.anyMatch(Files::isSymbolicLink)) throw new IOException("session-entry-unavailable");
                    }
                    IsolatedRenderAdapter.deleteDirectory(entry);
                }
            }
        }
    }
}
