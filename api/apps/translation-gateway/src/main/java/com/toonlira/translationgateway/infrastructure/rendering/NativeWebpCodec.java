package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderCodecException.Failure.*;
import static java.lang.foreign.MemoryLayout.PathElement.groupElement;
import static java.lang.foreign.ValueLayout.*;

import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import java.io.IOException;
import java.lang.foreign.Arena;
import java.lang.foreign.FunctionDescriptor;
import java.lang.foreign.Linker;
import java.lang.foreign.MemorySegment;
import java.lang.foreign.SymbolLookup;
import java.lang.invoke.MethodHandle;
import java.lang.invoke.MethodHandles;
import java.nio.channels.FileChannel;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.concurrent.Semaphore;

/** Explicit, owner-confined local FFM codec. No bean, download, shell, JNI or SDK. */
final class NativeWebpCodec implements AutoCloseable {
    private static final int VERSION = 0x010600;
    private static final long MAX_LIBRARY_BYTES = 32L * 1024 * 1024;
    private static final Semaphore CAPACITY = new Semaphore(1);
    private static final FunctionDescriptor WRITER = FunctionDescriptor.of(JAVA_INT, ADDRESS, JAVA_LONG, ADDRESS);
    private static final FunctionDescriptor PROGRESS = FunctionDescriptor.of(JAVA_INT, JAVA_INT, ADDRESS);
    private final Thread owner = Thread.currentThread();
    private final Arena libraries;
    private final Duration timeout;
    private final Linker linker;
    private final MethodHandle initConfig, validateConfig, initPicture, freePicture, encode, decode;
    private final MediaInspectionService inspector = new MediaInspectionService();

    NativeWebpCodec(Path library, String libraryHash, Path sharp, String sharpHash, Duration timeout) {
        if (timeout == null || timeout.isZero() || timeout.isNegative() || timeout.compareTo(Duration.ofSeconds(60)) > 0)
            throw new RenderCodecException(CONFIGURATION);
        verify(library, libraryHash); verify(sharp, sharpHash);
        NativeCodecPlatform.runtime();
        if (ADDRESS.byteSize() != Long.BYTES)
            throw new RenderCodecException(CONFIGURATION);
        this.timeout = timeout;
        libraries = Arena.ofConfined();
        try {
            linker = Linker.nativeLinker();
            if (!linker.canonicalLayouts().get("int").equals(JAVA_INT)
                || !linker.canonicalLayouts().get("size_t").equals(JAVA_LONG)) throw new RenderCodecException(CONFIGURATION);
            SymbolLookup.libraryLookup(sharp, libraries);
            var symbols = SymbolLookup.libraryLookup(library, libraries);
            for (var name : new String[]{"WebPGetEncoderVersion", "WebPGetDecoderVersion"}) {
                if ((int) function(symbols, name, FunctionDescriptor.of(JAVA_INT)).invokeExact() != VERSION)
                    throw new RenderCodecException(CONFIGURATION);
            }
            initConfig = function(symbols, "WebPConfigInitInternal", FunctionDescriptor.of(JAVA_INT, ADDRESS, JAVA_INT, JAVA_FLOAT, JAVA_INT));
            validateConfig = function(symbols, "WebPValidateConfig", FunctionDescriptor.of(JAVA_INT, ADDRESS));
            initPicture = function(symbols, "WebPPictureInitInternal", FunctionDescriptor.of(JAVA_INT, ADDRESS, JAVA_INT));
            freePicture = function(symbols, "WebPPictureFree", FunctionDescriptor.ofVoid(ADDRESS));
            encode = function(symbols, "WebPEncode", FunctionDescriptor.of(JAVA_INT, ADDRESS, ADDRESS));
            decode = function(symbols, "WebPDecodeBGRAInto", FunctionDescriptor.of(ADDRESS, ADDRESS, JAVA_LONG, ADDRESS, JAVA_LONG, JAVA_INT));
        } catch (Throwable error) { libraries.close(); throw new RenderCodecException(CONFIGURATION); }
    }

    WebpProcessCodec.Artifact encode(NativeArgbRaster source, Path directory, RenderPolicy policy) {
        checkOwner(); long started = start(); Path output = null; boolean returned = false;
        try {
            if (source == null || policy == null || directory == null || !directory.isAbsolute()
                || !Files.isDirectory(directory, LinkOption.NOFOLLOW_LINKS)) throw new RenderCodecException(INVALID_MEDIA);
            var image = source.image(); checkDimensions(image.getWidth(), image.getHeight(), policy);
            try (var arena = Arena.ofConfined()) {
                var config = arena.allocate(WebpNativeAbi.CONFIG); var picture = arena.allocate(WebpNativeAbi.PICTURE);
                if ((int) initConfig.invokeExact(config, 0, 100f, WebpNativeAbi.ENCODER_VERSION) == 0
                    || (int) initPicture.invokeExact(picture, WebpNativeAbi.ENCODER_VERSION) == 0)
                    throw new RenderCodecException(CONFIGURATION);
                try {
                    config.set(JAVA_INT, configOffset("lossless"), 1); config.set(JAVA_INT, configOffset("method"), policy.compressionMethod());
                    config.set(JAVA_INT, configOffset("exact"), 1);
                    if ((int) validateConfig.invokeExact(config) == 0) throw new RenderCodecException(CONFIGURATION);
                    picture.set(JAVA_INT, pictureOffset("use_argb"), 1);
                    picture.set(JAVA_INT, pictureOffset("width"), image.getWidth());
                    picture.set(JAVA_INT, pictureOffset("height"), image.getHeight());
                    picture.set(ADDRESS, pictureOffset("argb"), source.pixels());
                    picture.set(JAVA_INT, pictureOffset("argb_stride"), image.getWidth());
                    output = Files.createTempFile(directory, "render-native-", ".webp");
                    try (var channel = FileChannel.open(output, StandardOpenOption.WRITE)) {
                        var writer = new BoundedWriter(channel, policy.maxOutputBytes(), started, timeout);
                        var lookup = MethodHandles.lookup();
                        var write = lookup.findVirtual(BoundedWriter.class, "write", WRITER.toMethodType()).bindTo(writer);
                        var progress = lookup.findVirtual(BoundedWriter.class, "progress", PROGRESS.toMethodType()).bindTo(writer);
                        picture.set(ADDRESS, pictureOffset("writer"), linker.upcallStub(write, WRITER, arena));
                        picture.set(ADDRESS, pictureOffset("progress_hook"), linker.upcallStub(progress, PROGRESS, arena));
                        writer.check();
                        int success = (int) encode.invokeExact(config, picture);
                        writer.check();
                        if (success == 0) throw RenderCodecException.nativeEncodeFailure(picture.get(JAVA_INT, pictureOffset("error_code")));
                    }
                } finally { freePicture.invokeExact(picture); }
            }
            MediaInspectionService.InspectedMedia checked;
            try (var input = Files.newInputStream(output)) { checked = inspector.inspect(input, policy.maxOutputBytes()); }
            WebpProcessCodec.Artifact result;
            try {
                if (!"image/webp".equals(checked.mimeType()) || checked.widthPx() != image.getWidth()
                    || checked.heightPx() != image.getHeight()) throw new RenderCodecException(UNAVAILABLE);
                checkTime(started, timeout);
                result = new WebpProcessCodec.Artifact(output, new RenderedImage(checked.mimeType(), checked.byteSize(),
                    checked.widthPx(), checked.heightPx(), checked.sha256()));
            } finally { Files.delete(checked.path()); }
            returned = true; return result;
        } catch (RenderCodecException error) { throw error; }
        catch (Throwable error) { throw new RenderCodecException(UNAVAILABLE); }
        finally { try { cleanup(returned ? null : output); } finally { CAPACITY.release(); } }
    }

    void decodeInto(Path source, RenderedImage expected, RenderPolicy policy, NativeArgbRaster destination) {
        decodeInto(source, expected, policy, destination, policy == null ? 0 : policy.maxOutputBytes());
    }

    void decodeOriginalInto(Path source, RenderSource expected, RenderPolicy policy, NativeArgbRaster destination) {
        if (expected == null) throw new RenderCodecException(INVALID_MEDIA);
        decodeInto(source, new RenderedImage(expected.mimeType(), expected.byteSize(), expected.widthPx(), expected.heightPx(),
            expected.sha256()), policy, destination, policy == null ? 0 : policy.maxOriginalBytes());
    }

    private void decodeInto(Path source, RenderedImage expected, RenderPolicy policy, NativeArgbRaster destination, long byteLimit) {
        checkOwner(); long started = start(); Path snapshot = null;
        try {
            if (source == null || expected == null || policy == null || destination == null || expected.byteSize() > byteLimit)
                throw new RenderCodecException(INVALID_MEDIA);
            checkDimensions(expected.widthPx(), expected.heightPx(), policy);
            var image = destination.image();
            if (image.getWidth() != expected.widthPx() || image.getHeight() != expected.heightPx()) throw new RenderCodecException(INVALID_MEDIA);
            MediaInspectionService.InspectedMedia media;
            try (var input = Files.newInputStream(source)) { media = inspector.inspect(input, byteLimit); }
            snapshot = media.path();
            if (!"image/webp".equals(media.mimeType()) || media.byteSize() != expected.byteSize()
                || media.widthPx() != expected.widthPx() || media.heightPx() != expected.heightPx()
                || !media.sha256().equals(expected.sha256())) throw new RenderCodecException(INVALID_MEDIA);
            ValidatedRasterDecoder.validateContainer(media);
            try (var arena = Arena.ofConfined(); var input = FileChannel.open(snapshot, StandardOpenOption.READ)) {
                var compressed = arena.allocate(media.byteSize()); var bytes = compressed.asByteBuffer();
                while (bytes.hasRemaining()) { checkTime(started, timeout); if (input.read(bytes) < 0) throw new RenderCodecException(INVALID_MEDIA); }
                checkTime(started, timeout);
                var pixels = destination.pixels();
                var result = (MemorySegment) decode.invokeExact(compressed, media.byteSize(), pixels, pixels.byteSize(), image.getWidth() * Integer.BYTES);
                checkTime(started, timeout);
                if (result.address() != pixels.address()) throw new RenderCodecException(INVALID_MEDIA);
            }
        } catch (RenderCodecException error) { throw error; }
        catch (Throwable error) { throw new RenderCodecException(INVALID_MEDIA); }
        finally { try { cleanup(snapshot); } finally { CAPACITY.release(); } }
    }

    private MethodHandle function(SymbolLookup symbols, String name, FunctionDescriptor descriptor) {
        return linker.downcallHandle(symbols.findOrThrow(name), descriptor);
    }
    private static long configOffset(String name) { return WebpNativeAbi.CONFIG.byteOffset(groupElement(name)); }
    private static long pictureOffset(String name) { return WebpNativeAbi.PICTURE.byteOffset(groupElement(name)); }
    private static void checkDimensions(int width, int height, RenderPolicy policy) {
        try { PamRasterIo.dimensions(width, height, policy); }
        catch (IOException error) { throw new RenderCodecException(INVALID_MEDIA); }
    }
    private void checkOwner() {
        if (Thread.currentThread() != owner || !libraries.scope().isAlive()) throw new RenderCodecException(UNAVAILABLE);
    }
    private static long start() {
        if (Thread.currentThread().isInterrupted()) throw new RenderCodecException(UNAVAILABLE);
        if (!CAPACITY.tryAcquire()) throw new RenderCodecException(BUSY);
        return System.nanoTime();
    }
    private static void checkTime(long started, Duration timeout) {
        if (Thread.currentThread().isInterrupted()) throw new RenderCodecException(UNAVAILABLE);
        if (System.nanoTime() - started >= timeout.toNanos()) throw new RenderCodecException(TIMEOUT);
    }
    private static void verify(Path path, String hash) {
        try {
            if (path == null || !path.isAbsolute() || !Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS)
                || hash == null || !hash.matches("[0-9a-f]{64}") || Files.size(path) > MAX_LIBRARY_BYTES)
                throw new RenderCodecException(CONFIGURATION);
            var digest = MessageDigest.getInstance("SHA-256"); long count = 0;
            try (var input = Files.newInputStream(path)) {
                byte[] bytes = new byte[16_384]; int read;
                while ((read = input.read(bytes)) != -1) {
                    count += read; if (count > MAX_LIBRARY_BYTES) throw new RenderCodecException(CONFIGURATION);
                    digest.update(bytes, 0, read);
                }
            }
            if (!HexFormat.of().formatHex(digest.digest()).equals(hash)) throw new RenderCodecException(CONFIGURATION);
        } catch (RenderCodecException error) { throw error; }
        catch (Exception error) { throw new RenderCodecException(CONFIGURATION); }
    }
    private static void cleanup(Path path) {
        if (path != null) try { Files.deleteIfExists(path); }
        catch (IOException error) { throw new RenderCodecException(CLEANUP_FAILED); }
    }
    @Override public void close() {
        if (Thread.currentThread() != owner) throw new RenderCodecException(UNAVAILABLE);
        if (libraries.scope().isAlive()) libraries.close();
    }
    @Override public String toString() { return "NativeWebpCodec[redacted]"; }

    static final class BoundedWriter {
        private final FileChannel output; private final long limit, started; private final Duration timeout;
        private long count; private RenderCodecException.Failure failure;
        BoundedWriter(FileChannel output, long limit, long started, Duration timeout) {
            this.output = output; this.limit = limit; this.started = started; this.timeout = timeout;
        }
        void check() { if (failure != null) throw new RenderCodecException(failure); checkTime(started, timeout); }
        int write(MemorySegment data, long size, MemorySegment picture) {
            try {
                check(); if (size < 0 || size > limit - count) throw new RenderCodecException(OUTPUT_LIMIT);
                if (size > 0 && data.address() == 0) throw new RenderCodecException(UNAVAILABLE);
                var bytes = data.reinterpret(size).asByteBuffer();
                while (bytes.hasRemaining()) { check(); output.write(bytes); }
                count += size; return 1;
            } catch (Throwable error) {
                failure = error instanceof RenderCodecException sanitized ? sanitized.failure() : UNAVAILABLE;
                return 0;
            }
        }
        int progress(int percent, MemorySegment picture) {
            try { check(); return 1; }
            catch (Throwable error) {
                failure = error instanceof RenderCodecException sanitized ? sanitized.failure() : UNAVAILABLE;
                return 0;
            }
        }
    }
}
