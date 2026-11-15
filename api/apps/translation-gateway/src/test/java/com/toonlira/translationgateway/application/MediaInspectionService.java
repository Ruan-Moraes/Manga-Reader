package com.toonlira.translationgateway.application;

import static com.toonlira.translationgateway.domain.GatewayErrorCode.INVALID_REQUEST;
import static com.toonlira.translationgateway.domain.GatewayErrorCode.PAYLOAD_TOO_LARGE;
import static com.toonlira.translationgateway.domain.GatewayErrorCode.STORAGE_UNAVAILABLE;
import static com.toonlira.translationgateway.domain.GatewayErrorCode.UNSUPPORTED_MEDIA_TYPE;

import com.toonlira.translationgateway.domain.GatewayException;
import java.io.BufferedInputStream;
import java.io.DataInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.attribute.BasicFileAttributes;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.util.HexFormat;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.springframework.stereotype.Component;

@Component
public class MediaInspectionService {
    private static final int MAX_JPEG_HEADER_BYTES = 1_048_576;
    static final int MAX_PENDING_CLEANUPS = 64;
    private static final CleanupState PROCESS_CLEANUP = new CleanupState();
    private static final MediaSnapshotDirectory PROCESS_SNAPSHOTS = new MediaSnapshotDirectory(Path.of(System.getProperty("java.io.tmpdir")));
    private final ConcurrentMap<Path, PendingCleanup> pendingCleanup;
    private final Semaphore cleanupSlots;
    private final AtomicBoolean untrackedCleanup;
    private final CleanupState cleanupState;

    public MediaInspectionService() { this(PROCESS_CLEANUP); }

    MediaInspectionService(CleanupState state) {
        if (state == null) throw new IllegalArgumentException("invalid-cleanup-state");
        cleanupState = state;
        pendingCleanup = state.pendingCleanup;
        cleanupSlots = state.cleanupSlots;
        untrackedCleanup = state.untrackedCleanup;
    }

    public InspectedMedia inspect(InputStream input, long maxBytes) {
        requireCleanupHealthy();
        Path temporary = null;
        try {
            temporary = PROCESS_SNAPSHOTS.createSnapshot();
            var digest = MessageDigest.getInstance("SHA-256");
            long size = 0;
            try (var source = new DigestInputStream(new BufferedInputStream(input), digest);
                 var output = Files.newOutputStream(temporary)) {
                var buffer = new byte[16_384];
                int read;
                while ((read = source.read(buffer)) >= 0) {
                    size += read;
                    if (size > maxBytes) throw new GatewayException(PAYLOAD_TOO_LARGE, 413, false);
                    output.write(buffer, 0, read);
                }
            }
            if (size == 0) throw new GatewayException(INVALID_REQUEST, 400, false);
            Dimensions dimensions;
            try {
                dimensions = inspectHeader(temporary);
            } catch (IOException malformed) {
                throw new GatewayException(UNSUPPORTED_MEDIA_TYPE, 415, false);
            }
            return new InspectedMedia(temporary, dimensions.mimeType(), size, dimensions.width(), dimensions.height(),
                HexFormat.of().formatHex(digest.digest()));
        } catch (GatewayException error) {
            deleteQuietly(temporary);
            requireCleanupHealthy();
            throw error;
        } catch (IOException | NoSuchAlgorithmException error) {
            deleteQuietly(temporary);
            requireCleanupHealthy();
            throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
        }
    }

    private Dimensions inspectHeader(Path path) throws IOException {
        try (var input = new DataInputStream(new BufferedInputStream(Files.newInputStream(path)))) {
            var first = input.readNBytes(32);
            if (first.length >= 24 && isPng(first)) {
                return valid(new Dimensions("image/png", bigEndianInt(first, 16), bigEndianInt(first, 20)));
            }
            if (first.length >= 30 && isWebp(first)) return valid(inspectWebp(first));
        }
        return inspectJpeg(path);
    }

    private boolean isPng(byte[] value) {
        byte[] signature = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
        for (int index = 0; index < signature.length; index++) if (value[index] != signature[index]) return false;
        return ascii(value, 12, 4).equals("IHDR");
    }

    private boolean isWebp(byte[] value) {
        return ascii(value, 0, 4).equals("RIFF") && ascii(value, 8, 4).equals("WEBP");
    }

    private Dimensions inspectWebp(byte[] value) {
        var kind = ascii(value, 12, 4);
        if ("VP8X".equals(kind)) {
            return new Dimensions("image/webp", 1 + little24(value, 24), 1 + little24(value, 27));
        }
        if ("VP8L".equals(kind) && value[20] == 0x2f) {
            int b0 = unsigned(value[21]);
            int b1 = unsigned(value[22]);
            int b2 = unsigned(value[23]);
            int b3 = unsigned(value[24]);
            return new Dimensions("image/webp", 1 + b0 + ((b1 & 0x3f) << 8),
                1 + ((b1 >> 6) | (b2 << 2) | ((b3 & 0x0f) << 10)));
        }
        if ("VP8 ".equals(kind) && unsigned(value[23]) == 0x9d && unsigned(value[24]) == 0x01 && unsigned(value[25]) == 0x2a) {
            return new Dimensions("image/webp", little16(value, 26) & 0x3fff, little16(value, 28) & 0x3fff);
        }
        throw new GatewayException(UNSUPPORTED_MEDIA_TYPE, 415, false);
    }

    private Dimensions inspectJpeg(Path path) throws IOException {
        try (var input = new DataInputStream(new BufferedInputStream(Files.newInputStream(path)))) {
            if (input.readUnsignedShort() != 0xffd8) throw new GatewayException(UNSUPPORTED_MEDIA_TYPE, 415, false);
            int scanned = 2;
            while (scanned < MAX_JPEG_HEADER_BYTES) {
                int prefix;
                do { prefix = input.readUnsignedByte(); scanned++; } while (prefix != 0xff && scanned < MAX_JPEG_HEADER_BYTES);
                int marker;
                do { marker = input.readUnsignedByte(); scanned++; } while (marker == 0xff);
                if (marker == 0xd9 || marker == 0xda) break;
                int length = input.readUnsignedShort();
                scanned += 2;
                if (length < 2) break;
                if (isStartOfFrame(marker)) {
                    input.readUnsignedByte();
                    int height = input.readUnsignedShort();
                    int width = input.readUnsignedShort();
                    return valid(new Dimensions("image/jpeg", width, height));
                }
                input.skipNBytes(length - 2L);
                scanned += length - 2;
            }
        }
        throw new GatewayException(UNSUPPORTED_MEDIA_TYPE, 415, false);
    }

    private boolean isStartOfFrame(int marker) {
        return marker >= 0xc0 && marker <= 0xcf && marker != 0xc4 && marker != 0xc8 && marker != 0xcc;
    }

    private Dimensions valid(Dimensions dimensions) {
        if (dimensions.width() <= 0 || dimensions.height() <= 0) throw new GatewayException(INVALID_REQUEST, 400, false);
        return dimensions;
    }

    private String ascii(byte[] value, int offset, int length) {
        return new String(value, offset, length, java.nio.charset.StandardCharsets.US_ASCII);
    }

    private int unsigned(byte value) { return value & 0xff; }
    private int little16(byte[] value, int offset) { return unsigned(value[offset]) | (unsigned(value[offset + 1]) << 8); }
    private int little24(byte[] value, int offset) { return little16(value, offset) | (unsigned(value[offset + 2]) << 16); }
    private int bigEndianInt(byte[] value, int offset) {
        return (unsigned(value[offset]) << 24) | (unsigned(value[offset + 1]) << 16)
            | (unsigned(value[offset + 2]) << 8) | unsigned(value[offset + 3]);
    }

    public void deleteQuietly(Path path) {
        if (path == null) return;
        var existing = pendingCleanup.get(path);
        if (existing != null) {
            retryCleanup(path, existing, false);
            return;
        }
        PendingCleanup candidate;
        try {
            var attributes = Files.readAttributes(path, BasicFileAttributes.class, LinkOption.NOFOLLOW_LINKS);
            candidate = new PendingCleanup(attributes.fileKey());
        } catch (NoSuchFileException absent) {
            return;
        } catch (IOException | SecurityException unavailable) {
            rememberUnknown(path);
            return;
        }
        if (!cleanupSlots.tryAcquire()) {
            if (!deleteCandidate(path, candidate, true)) untrackedCleanup.set(true);
            return;
        }
        existing = pendingCleanup.putIfAbsent(path, candidate);
        if (existing != null) cleanupSlots.release();
        retryCleanup(path, existing == null ? candidate : existing, existing == null);
    }

    /** Retry owned files before admitting more snapshots; fail closed while any deletion remains incomplete. */
    public void requireCleanupHealthy() {
        try { PROCESS_SNAPSHOTS.requireReady(); }
        catch (IOException | RuntimeException unavailable) { throw new GatewayException(STORAGE_UNAVAILABLE, 503, true); }
        pendingCleanup.forEach((path, pending) -> retryCleanup(path, pending, false));
        if (untrackedCleanup.get() || !pendingCleanup.isEmpty()) throw new GatewayException(STORAGE_UNAVAILABLE, 503, true);
    }

    private void rememberUnknown(Path path) {
        if (!cleanupSlots.tryAcquire()) { untrackedCleanup.set(true); return; }
        if (pendingCleanup.putIfAbsent(path, new PendingCleanup(null)) != null) cleanupSlots.release();
        scheduleCleanup();
    }

    private void retryCleanup(Path path, PendingCleanup pending, boolean initial) {
        if (deleteCandidate(path, pending, initial)) {
            if (pendingCleanup.remove(path, pending)) cleanupSlots.release();
        } else scheduleCleanup();
    }

    private void scheduleCleanup() {
        if (pendingCleanup.isEmpty() || !cleanupState.retryRunning.compareAndSet(false, true)) return;
        try {
            Thread.ofVirtual().name("media-cleanup-retry").inheritInheritableThreadLocals(false).start(() -> {
                try {
                    while (!pendingCleanup.isEmpty()) {
                        try { TimeUnit.NANOSECONDS.sleep(cleanupState.retryDelayNanos); }
                        catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); break; }
                        pendingCleanup.forEach((path, pending) -> retryCleanup(path, pending, false));
                    }
                } finally {
                    cleanupState.retryRunning.set(false);
                    if (!Thread.currentThread().isInterrupted() && !pendingCleanup.isEmpty()) scheduleCleanup();
                }
            });
        } catch (RuntimeException unavailable) {
            // A later inspection can still retry the bounded backlog.
            cleanupState.retryRunning.set(false);
        }
    }

    private boolean deleteCandidate(Path path, PendingCleanup pending, boolean initial) {
        try {
            var current = Files.readAttributes(path, BasicFileAttributes.class, LinkOption.NOFOLLOW_LINKS);
            if (pending.fileKey == null ? !initial : !pending.fileKey.equals(current.fileKey())) return false;
            Files.deleteIfExists(path);
            return true;
        } catch (NoSuchFileException absent) {
            return true;
        } catch (IOException | SecurityException ignored) {
            // Retain ownership for a later retry; paths and filesystem errors are never logged.
            return false;
        }
    }

    private static final class PendingCleanup {
        private final Object fileKey;
        private PendingCleanup(Object fileKey) { this.fileKey = fileKey; }
    }

    static final class CleanupState {
        private final ConcurrentMap<Path, PendingCleanup> pendingCleanup = new ConcurrentHashMap<>();
        private final Semaphore cleanupSlots = new Semaphore(MAX_PENDING_CLEANUPS);
        private final AtomicBoolean untrackedCleanup = new AtomicBoolean();
        private final AtomicBoolean retryRunning = new AtomicBoolean();
        private final long retryDelayNanos;

        CleanupState() { this(Duration.ofSeconds(30)); }
        CleanupState(Duration delay) {
            if (delay == null || delay.isZero() || delay.isNegative() || delay.compareTo(Duration.ofMinutes(1)) > 0)
                throw new IllegalArgumentException("invalid-cleanup-retry-delay");
            retryDelayNanos = delay.toNanos();
        }
    }

    public record InspectedMedia(Path path, String mimeType, long byteSize, int widthPx, int heightPx, String sha256) { }
    private record Dimensions(String mimeType, int width, int height) { }
}
