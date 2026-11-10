package com.toonlira.translationgateway.infrastructure.rendering;

import java.io.IOException;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.attribute.PosixFilePermissions;

/** Private JVM/font scratch only. Call close after confirmed child death and writer termination. */
final class OwnedRenderRuntime implements AutoCloseable {
    private final Path directory;
    private OwnedRenderRuntime(Path directory) { this.directory = directory; }
    static OwnedRenderRuntime create(Path parent) throws IOException {
        return new OwnedRenderRuntime(Files.createTempDirectory(parent, "volatile-jvm-",
            PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rwx------"))));
    }
    Path directory() { return directory; }
    @Override public void close() {
        try {
            // No FOLLOW_LINKS: a child-created symlink must never extend cleanup outside its directory.
            Files.walkFileTree(directory, new SimpleFileVisitor<>() {
                @Override public FileVisitResult visitFile(Path file, BasicFileAttributes attributes) throws IOException {
                    Files.delete(file); return FileVisitResult.CONTINUE;
                }
                @Override public FileVisitResult postVisitDirectory(Path path, IOException failure) throws IOException {
                    if (failure != null) throw failure;
                    Files.delete(path); return FileVisitResult.CONTINUE;
                }
            });
        } catch (IOException failure) {
            throw new RenderFileException(RenderFileException.Failure.CLEANUP_FAILED);
        }
    }
}
