package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CANCELLED;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CLEANUP_FAILED;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.INVALID_MEDIA;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.TIMEOUT;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.UNAVAILABLE;

import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.application.port.RenderPort;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import java.io.IOException;
import java.nio.file.FileVisitResult;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.SimpleFileVisitor;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.Duration;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.LockSupport;

/** Explicit opt-in supervisor. The configured native bean also supplies a revalidated memory prerequisite. */
public final class IsolatedRenderAdapter implements RenderPort {
    private static final RenderCallSupervisor CALLS = new RenderCallSupervisor();
    private static final long PROCESS_POLL_NANOS = TimeUnit.MILLISECONDS.toNanos(20);
    private static final int COPY_BUFFER_BYTES = 8192;
    private final Path temporaryDirectory;
    private final RenderProcessSettings settings;
    private final Duration deadline;
    private final int heapMiB;
    private final ChildLauncher launcher;
    private final Runnable admission;

    public IsolatedRenderAdapter(Path temporaryDirectory, RenderProcessSettings settings, Duration deadline, int heapMiB) {
        this(temporaryDirectory, settings, deadline, heapMiB, (directory, heap) ->
            RenderJvmLauncher.builder(directory, heap, RenderChildMain.class.getName(), settings).start());
    }

    IsolatedRenderAdapter(Path temporaryDirectory, RenderProcessSettings settings, Duration deadline, int heapMiB,
                          Runnable admission) {
        this(temporaryDirectory, settings, deadline, heapMiB, (directory, heap) ->
            RenderJvmLauncher.builder(directory, heap, RenderChildMain.class.getName(), settings).start(), admission);
    }

    IsolatedRenderAdapter(Path temporaryDirectory, RenderProcessSettings settings, Duration deadline, int heapMiB,
                          ChildLauncher launcher) {
        this(temporaryDirectory, settings, deadline, heapMiB, launcher, () -> { });
    }

    IsolatedRenderAdapter(Path temporaryDirectory, RenderProcessSettings settings, Duration deadline, int heapMiB,
                          ChildLauncher launcher, Runnable admission) {
        try {
            if (temporaryDirectory == null || !temporaryDirectory.isAbsolute()
                || !Files.isDirectory(temporaryDirectory, LinkOption.NOFOLLOW_LINKS) || settings == null
                || deadline == null || deadline.isNegative() || deadline.isZero()
                || deadline.compareTo(Duration.ofMinutes(5)) > 0 || heapMiB < 64 || heapMiB > 2048
                || settings instanceof BoundedNativeRenderChildSettings && heapMiB > 512
                || launcher == null || admission == null) throw new RenderFileException(CONFIGURATION);
            this.temporaryDirectory = temporaryDirectory.toRealPath();
            this.settings = settings;
            this.deadline = deadline;
            this.heapMiB = heapMiB;
            this.launcher = launcher;
            this.admission = admission;
        } catch (IOException error) { throw new RenderFileException(CONFIGURATION); }
    }

    @Override public Output render(Path original, RenderRequest request) {
        return CALLS.execute(deadline, started -> renderOwned(original, request, started), result -> {
            try { Files.deleteIfExists(result.path()); }
            catch (IOException | RuntimeException error) { throw new RenderFileException(CLEANUP_FAILED); }
        });
    }

    private Output renderOwned(Path original, RenderRequest request, long started) {
        Path directory = null, transferred = null;
        Process process = null;
        var descendants = new LinkedHashSet<ProcessHandle>();
        boolean success = false;
        try {
            if (original == null || !original.isAbsolute() || request == null
                || !Files.isRegularFile(original, LinkOption.NOFOLLOW_LINKS)) throw new RenderFileException(INVALID_MEDIA);
            if (settings instanceof BoundedNativeRenderChildSettings) LinuxOomPolicy.requireSupervisor();
            // Recheck while owning the one-page capacity and before copying the request, decode or native launch.
            admission.run();
            directory = Files.createTempDirectory(temporaryDirectory, "render-jvm-",
                PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rwx------")));
            // Caller may discard its borrowed path on timeout; only this operation owns the child's input lifetime.
            var snapshot = snapshotOriginal(original, directory, request, started);
            RenderSubprocessProtocol.writeRequest(directory.resolve("request.bin"), snapshot, settings, request);
            checkDeadline(started);
            process = launcher.start(directory, heapMiB);
            process.getOutputStream().close();
            await(process, descendants, started);
            // Do not validate/delete while an observed native descendant can still access the staging files.
            stop(process, descendants);
            var result = RenderSubprocessProtocol.readResult(directory.resolve("result.bin"), directory, request);
            verify(result, request);
            checkDeadline(started);
            transferred = Files.createTempFile(temporaryDirectory, "render-isolated-", ".webp",
                PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")));
            Files.setPosixFilePermissions(result.path(), PosixFilePermissions.fromString("rw-------"));
            Files.move(result.path(), transferred, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
            deleteDirectory(directory);
            directory = null;
            var output = new Output(transferred, result.manifest());
            success = true;
            return output;
        } catch (RenderFileException error) { throw error; }
        catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new RenderFileException(CANCELLED);
        } catch (IOException | RuntimeException error) { throw new RenderFileException(UNAVAILABLE); }
        finally {
            boolean stopped = process == null;
            try {
                if (process != null) {
                    stop(process, descendants);
                    stopped = !process.isAlive() && descendants.stream().noneMatch(ProcessHandle::isAlive);
                }
                if (!stopped) throw new RenderFileException(CLEANUP_FAILED);
                cleanup(directory, success ? null : transferred);
            } catch (IOException | RuntimeException error) { throw new RenderFileException(CLEANUP_FAILED); }
            // CALLS retains capacity until this cleanup and the output-ownership decision have completed.
        }
    }

    private void await(Process process, Set<ProcessHandle> descendants, long started) throws InterruptedException {
        while (true) {
            descendants.addAll(process.descendants().toList());
            checkDeadline(started);
            long remaining = deadline.toNanos() - (System.nanoTime() - started);
            if (process.waitFor(Math.min(PROCESS_POLL_NANOS, Math.max(1, remaining)), TimeUnit.NANOSECONDS)) {
                checkDeadline(started);
                if (process.exitValue() != 0) throw new RenderFileException(UNAVAILABLE);
                return;
            }
        }
    }

    private Path snapshotOriginal(Path borrowed, Path directory, RenderRequest request, long started) throws IOException {
        var snapshot = Files.createFile(directory.resolve("original.bin"),
            PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")));
        MessageDigest digest;
        try { digest = MessageDigest.getInstance("SHA-256"); }
        catch (NoSuchAlgorithmException impossible) { throw new RenderFileException(UNAVAILABLE); }
        long copied = 0;
        try (var input = Files.newInputStream(borrowed, LinkOption.NOFOLLOW_LINKS);
             var output = Files.newOutputStream(snapshot, StandardOpenOption.WRITE, LinkOption.NOFOLLOW_LINKS)) {
            var buffer = new byte[COPY_BUFFER_BYTES];
            int read;
            while ((read = input.read(buffer)) != -1) {
                checkDeadline(started);
                copied += read;
                if (copied > request.policy().maxOriginalBytes() || copied > request.source().byteSize())
                    throw new RenderFileException(INVALID_MEDIA);
                digest.update(buffer, 0, read); output.write(buffer, 0, read);
            }
        }
        if (copied != request.source().byteSize()
            || !HexFormat.of().formatHex(digest.digest()).equals(request.source().sha256()))
            throw new RenderFileException(INVALID_MEDIA);
        checkDeadline(started);
        return snapshot;
    }

    private void checkDeadline(long started) {
        if (Thread.currentThread().isInterrupted()) throw new RenderFileException(CANCELLED);
        if (System.nanoTime() - started >= deadline.toNanos()) throw new RenderFileException(TIMEOUT);
    }

    private static void stop(Process process, Set<ProcessHandle> descendants) {
        boolean interrupted = Thread.interrupted();
        try {
            // A failed OS enumeration must never skip terminating the directly owned JVM.
            try {
                if (process.isAlive()) descendants.addAll(process.descendants().toList());
            } catch (RuntimeException ignored) {
                // await already rejects unavailable supervision; never expose the native diagnostic.
            } finally { process.destroyForcibly(); }
            descendants.forEach(child -> { if (child.isAlive()) child.destroyForcibly(); });
            while (true) {
                try { process.waitFor(); break; }
                catch (InterruptedException error) { interrupted = true; }
            }
            // Keep capacity even during delayed native termination; no timeout silently releases a live child.
            while (descendants.stream().anyMatch(ProcessHandle::isAlive)) {
                descendants.forEach(child -> { if (child.isAlive()) child.destroyForcibly(); });
                LockSupport.parkNanos(PROCESS_POLL_NANOS);
                interrupted |= Thread.interrupted();
            }
        } finally { if (interrupted) Thread.currentThread().interrupt(); }
    }

    private static void verify(Output result, RenderRequest request) throws IOException {
        var inspector = new MediaInspectionService();
        MediaInspectionService.InspectedMedia media;
        try (var stream = Files.newInputStream(result.path(), LinkOption.NOFOLLOW_LINKS)) {
            media = inspector.inspect(stream, request.policy().maxOutputBytes());
        }
        try {
            var image = result.manifest().image();
            if (!media.mimeType().equals(image.mimeType()) || media.byteSize() != image.byteSize()
                || media.widthPx() != image.widthPx() || media.heightPx() != image.heightPx()
                || !media.sha256().equals(image.sha256())) throw new RenderFileException(UNAVAILABLE);
        } finally { Files.deleteIfExists(media.path()); }
    }

    private static void deleteDirectory(Path directory) throws IOException {
        if (directory == null) return;
        // The exact per-call directory, not a bucket/workspace scan. walkFileTree does not follow symlinks.
        Files.walkFileTree(directory, new SimpleFileVisitor<>() {
            @Override public FileVisitResult visitFile(Path file, BasicFileAttributes attributes) throws IOException {
                Files.delete(file); return FileVisitResult.CONTINUE;
            }
            @Override public FileVisitResult postVisitDirectory(Path path, IOException error) throws IOException {
                if (error != null) throw error;
                Files.delete(path); return FileVisitResult.CONTINUE;
            }
        });
    }

    private static void cleanup(Path directory, Path transferred) throws IOException {
        IOException failure = null;
        try { deleteDirectory(directory); } catch (IOException error) { failure = error; }
        try { if (transferred != null) Files.deleteIfExists(transferred); }
        catch (IOException error) { failure = error; }
        if (failure != null) throw failure;
    }

    @Override public String toString() { return "IsolatedRenderAdapter[redacted]"; }
    static boolean isCallCapacityAvailable() { return CALLS.isAvailable(); }
    @FunctionalInterface interface ChildLauncher { Process start(Path directory, int heapMiB) throws IOException; }
}
