package com.toonlira.translationgateway.application;

import java.io.IOException;
import java.nio.channels.FileChannel;
import java.nio.channels.FileLock;
import java.nio.file.Files;
import java.nio.file.FileAlreadyExistsException;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.attribute.PosixFilePermissions;
import java.util.Set;

/** A private process lock distinguishes abandoned snapshots from files still owned by another JVM. */
final class MediaSnapshotDirectory {
    private static final String DIRECTORY = "translation-media-snapshots-v1", LOCK = ".owner.lock";
    private static final int MAX_RECOVERY_FILES = 64;
    private final Path parent;
    private Path directory;
    private FileChannel channel;
    private FileLock lock;
    private Object directoryIdentity, lockIdentity;
    private boolean recovered;

    MediaSnapshotDirectory(Path parent) { this.parent = parent; }

    synchronized Path createSnapshot() throws IOException {
        requireReady();
        return Files.createTempFile(directory, "snapshot-", ".upload",
            PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")));
    }

    synchronized void requireReady() throws IOException {
        if (lock == null) acquire();
        if (!lock.isValid() || !directoryIdentity.equals(identity(directory, true))
            || !lockIdentity.equals(identity(directory.resolve(LOCK), false))) throw new IOException("snapshot-owner-unavailable");
        if (recovered) return;
        // Legacy flat files have no durable ownership proof. Recycle their private scratch; never claim a global tmp file.
        try (var legacy = Files.newDirectoryStream(parent, "translation-page-*.upload")) {
            if (legacy.iterator().hasNext()) throw new IOException("legacy-snapshot-owner-unavailable");
        }
        int scanned = 0;
        boolean failed = false;
        try (var entries = Files.newDirectoryStream(directory)) {
            for (var entry : entries) {
                var name = entry.getFileName().toString();
                if (name.equals(LOCK)) continue;
                if (++scanned > MAX_RECOVERY_FILES) { failed = true; break; }
                try {
                    if (!name.matches("snapshot-[0-9]+\\.upload")) throw new IOException("unknown-snapshot-entry");
                    identity(entry, false);
                    Files.delete(entry);
                } catch (IOException | SecurityException unavailable) { failed = true; }
            }
        }
        if (failed) throw new IOException("snapshot-recovery-incomplete");
        recovered = true;
    }

    private void acquire() throws IOException {
        var root = parent.toRealPath();
        if (!Files.getFileStore(root).supportsFileAttributeView("posix")) throw new IOException("snapshot-filesystem-unavailable");
        directory = root.resolve(DIRECTORY);
        try {
            Files.createDirectory(directory, PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rwx------")));
        } catch (FileAlreadyExistsException existing) { /* Existing state is verified before taking ownership. */ }
        directoryIdentity = identity(directory, true);
        var path = directory.resolve(LOCK);
        var candidate = FileChannel.open(path, Set.of(StandardOpenOption.CREATE, StandardOpenOption.WRITE, LinkOption.NOFOLLOW_LINKS),
            PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")));
        try {
            lockIdentity = identity(path, false);
            var acquired = candidate.tryLock();
            if (acquired == null) throw new IOException("snapshot-owner-busy");
            channel = candidate;
            lock = acquired;
        } finally {
            if (channel != candidate) candidate.close();
        }
    }

    private static Object identity(Path path, boolean directory) throws IOException {
        var attributes = Files.readAttributes(path, BasicFileAttributes.class, LinkOption.NOFOLLOW_LINKS);
        var expected = PosixFilePermissions.fromString(directory ? "rwx------" : "rw-------");
        if (attributes.fileKey() == null || (directory ? !attributes.isDirectory() : !attributes.isRegularFile())
            || !Files.getPosixFilePermissions(path, LinkOption.NOFOLLOW_LINKS).equals(expected))
            throw new IOException("snapshot-identity-unavailable");
        return attributes.fileKey();
    }
}
