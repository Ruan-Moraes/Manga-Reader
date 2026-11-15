package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderCodecException.Failure.BUSY;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderCodecException.Failure.CLEANUP_FAILED;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderCodecException.Failure.CONFIGURATION;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderCodecException.Failure.INVALID_MEDIA;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderCodecException.Failure.OUTPUT_LIMIT;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderCodecException.Failure.TIMEOUT;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderCodecException.Failure.UNAVAILABLE;

import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import java.awt.image.BufferedImage;
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/** Explicitly prepared local libwebp tools, never a PATH lookup, shell, download or Spring bean. */
public final class WebpProcessCodec {
    public static final String VERSION = "1.6.0";
    private static final int BUFFER_BYTES = 16_384;
    private static final int MAX_VERSION_BYTES = 128;
    private static final long MAX_BINARY_BYTES = 32L * 1024 * 1024;
    private static final Semaphore NATIVE_CAPACITY = new Semaphore(1);
    private final Binary encoder;
    private final Binary decoder;
    private final Duration timeout;
    private final ProcessStarter starter;
    private final MediaInspectionService inspector = new MediaInspectionService();

    public WebpProcessCodec(Path encoder, String encoderHash, Path decoder, String decoderHash, Duration timeout) {
        this(encoder, encoderHash, decoder, decoderHash, timeout, command ->
            new ProcessBuilder(command).redirectError(ProcessBuilder.Redirect.DISCARD).start());
    }

    WebpProcessCodec(Path encoder, String encoderHash, Path decoder, String decoderHash, Duration timeout,
                     ProcessStarter starter) {
        if (timeout == null || timeout.isNegative() || timeout.isZero() || timeout.compareTo(Duration.ofSeconds(60)) > 0
            || starter == null) throw new RenderCodecException(CONFIGURATION);
        this.timeout = timeout;
        this.starter = starter;
        this.encoder = binary(encoder, encoderHash);
        this.decoder = binary(decoder, decoderHash);
        version(this.encoder);
        version(this.decoder);
    }

    public Artifact encode(BufferedImage image, Path workingDirectory, RenderPolicy policy) {
        Path pam = null, output = null, checked = null;
        boolean returned = false;
        try {
            PamRasterIo.dimensions(image == null ? 0 : image.getWidth(), image == null ? 0 : image.getHeight(), policy);
            validateDirectory(workingDirectory);
            verify(encoder);
            pam = Files.createTempFile(workingDirectory, "render-", ".pam");
            try (var stream = new BufferedOutputStream(Files.newOutputStream(pam))) {
                PamRasterIo.write(image, stream, policy);
            }
            output = Files.createTempFile(workingDirectory, "render-", ".webp");
            final Path destination = output;
            run(List.of(encoder.path().toString(), "-quiet", "-lossless", "-exact", "-q", "100", "-m", Integer.toString(policy.compressionMethod()),
                "-metadata", "none", "-o", "-", "--", pam.toString()), input -> {
                    try (var stream = new BufferedOutputStream(Files.newOutputStream(destination))) {
                        copyBounded(input, stream, policy.maxOutputBytes());
                    }
                    return null;
                });
            MediaInspectionService.InspectedMedia media;
            try (var input = Files.newInputStream(output)) { media = inspector.inspect(input, policy.maxOutputBytes()); }
            checked = media.path();
            if (!"image/webp".equals(media.mimeType()) || media.widthPx() != image.getWidth()
                || media.heightPx() != image.getHeight()) throw new RenderCodecException(UNAVAILABLE);
            var metadata = new RenderedImage(media.mimeType(), media.byteSize(), media.widthPx(), media.heightPx(), media.sha256());
            var result = new Artifact(output, metadata);
            cleanup(checked, pam);
            checked = null;
            pam = null;
            returned = true;
            return result;
        } catch (RenderCodecException error) { throw error; }
        catch (IOException | RuntimeException error) { throw new RenderCodecException(UNAVAILABLE); }
        finally {
            // Only exact paths created by this operation; never scan the caller's directory.
            cleanup(checked, pam, returned ? null : output);
        }
    }

    public BufferedImage decode(Path source, RenderedImage expected, RenderPolicy policy) {
        Path snapshot = null;
        try {
            if (source == null || expected == null || policy == null || expected.byteSize() > policy.maxOutputBytes())
                throw new RenderCodecException(INVALID_MEDIA);
            PamRasterIo.dimensions(expected.widthPx(), expected.heightPx(), policy);
            MediaInspectionService.InspectedMedia media;
            try (var input = Files.newInputStream(source)) { media = inspector.inspect(input, policy.maxOutputBytes()); }
            snapshot = media.path();
            if (!"image/webp".equals(media.mimeType()) || media.widthPx() != expected.widthPx()
                || media.heightPx() != expected.heightPx() || media.byteSize() != expected.byteSize()
                || !media.sha256().equals(expected.sha256())) throw new RenderCodecException(INVALID_MEDIA);
            verify(decoder);
            return run(List.of(decoder.path().toString(), "-quiet", "-pam", "-o", "-", "--", snapshot.toString()),
                input -> PamRasterIo.read(input, expected.widthPx(), expected.heightPx(), policy));
        } catch (RenderCodecException error) { throw error; }
        catch (IOException | RuntimeException error) { throw new RenderCodecException(INVALID_MEDIA); }
        finally { cleanup(snapshot); }
    }

    private void version(Binary executable) {
        try {
            String value = run(List.of(executable.path().toString(), "-version"), input -> {
                byte[] bytes = input.readNBytes(MAX_VERSION_BYTES + 1);
                if (bytes.length > MAX_VERSION_BYTES) throw new IOException("invalid-version");
                return new String(bytes, StandardCharsets.US_ASCII);
            });
            if (!value.lines().findFirst().orElse("").equals(VERSION)) throw new RenderCodecException(CONFIGURATION);
        } catch (RenderCodecException error) { throw new RenderCodecException(CONFIGURATION); }
    }

    private <T> T run(List<String> command, Reader<T> reader) {
        if (!NATIVE_CAPACITY.tryAcquire()) throw new RenderCodecException(BUSY);
        Process process = null;
        var expired = new AtomicBoolean();
        var timer = Executors.newSingleThreadScheduledExecutor(Thread.ofPlatform().daemon().factory());
        try {
            process = starter.start(List.copyOf(command));
            process.getOutputStream().close();
            final Process active = process;
            timer.schedule(() -> {
                expired.set(true);
                if (active.isAlive()) active.destroyForcibly();
            }, timeout.toNanos(), TimeUnit.NANOSECONDS);
            T result;
            try (var input = new BufferedInputStream(process.getInputStream())) { result = reader.read(input); }
            int exit = process.waitFor();
            if (expired.get()) throw new RenderCodecException(TIMEOUT);
            if (exit != 0) throw new RenderCodecException(UNAVAILABLE);
            return result;
        } catch (RenderCodecException error) { throw error; }
        catch (IOException | InterruptedException error) {
            if (error instanceof InterruptedException) Thread.currentThread().interrupt();
            throw new RenderCodecException(expired.get() ? TIMEOUT : UNAVAILABLE);
        } finally {
            timer.shutdownNow();
            if (process != null) terminateAndWait(process);
            NATIVE_CAPACITY.release();
        }
    }

    private static void terminateAndWait(Process process) {
        if (process.isAlive()) process.destroyForcibly();
        boolean interrupted = false;
        while (true) {
            try { process.waitFor(); break; }
            catch (InterruptedException error) { interrupted = true; }
        }
        if (interrupted) Thread.currentThread().interrupt();
    }

    private static void copyBounded(InputStream input, OutputStream output, long limit) throws IOException {
        long count = 0;
        var buffer = new byte[BUFFER_BYTES];
        int read;
        while ((read = input.read(buffer)) != -1) {
            if (read > limit - count) throw new RenderCodecException(OUTPUT_LIMIT);
            output.write(buffer, 0, read);
            count += read;
        }
    }

    private static Binary binary(Path path, String hash) {
        try {
            if (path == null || !path.isAbsolute() || hash == null || !hash.matches("[0-9a-f]{64}"))
                throw new RenderCodecException(CONFIGURATION);
            var binary = new Binary(path.toRealPath(), hash);
            verify(binary);
            return binary;
        } catch (IOException error) { throw new RenderCodecException(CONFIGURATION); }
    }

    private static void verify(Binary binary) {
        try {
            if (!Files.isRegularFile(binary.path(), LinkOption.NOFOLLOW_LINKS) || !Files.isExecutable(binary.path())
                || Files.size(binary.path()) > MAX_BINARY_BYTES) throw new RenderCodecException(CONFIGURATION);
            var digest = MessageDigest.getInstance("SHA-256");
            try (var input = Files.newInputStream(binary.path())) {
                var buffer = new byte[BUFFER_BYTES];
                long count = 0;
                int read;
                while ((read = input.read(buffer)) != -1) {
                    count += read;
                    if (count > MAX_BINARY_BYTES) throw new RenderCodecException(CONFIGURATION);
                    digest.update(buffer, 0, read);
                }
            }
            if (!HexFormat.of().formatHex(digest.digest()).equals(binary.sha256())) throw new RenderCodecException(CONFIGURATION);
        } catch (IOException | NoSuchAlgorithmException error) { throw new RenderCodecException(CONFIGURATION); }
    }

    private static void validateDirectory(Path directory) {
        if (directory == null || !directory.isAbsolute() || !Files.isDirectory(directory, LinkOption.NOFOLLOW_LINKS))
            throw new RenderCodecException(CONFIGURATION);
    }

    private static void cleanup(Path... paths) {
        boolean failed = false;
        for (var path : paths) if (path != null) {
            try { Files.deleteIfExists(path); } catch (IOException error) { failed = true; }
        }
        if (failed) throw new RenderCodecException(CLEANUP_FAILED);
    }

    @Override public String toString() { return "WebpProcessCodec[redacted]"; }
    public record Artifact(Path path, RenderedImage image) {
        @Override public String toString() { return "WebpArtifact[redacted]"; }
    }
    private record Binary(Path path, String sha256) { }
    @FunctionalInterface interface ProcessStarter { Process start(List<String> command) throws IOException; }
    @FunctionalInterface private interface Reader<T> { T read(InputStream input) throws IOException; }
}
