package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class WebpProcessCodecTest {
    private static final RenderPolicy POLICY = RenderPolicy.initial();
    @TempDir Path temporary;

    @Test
    void refusesInvalidBinaryHashBeforeStartingAnyProcessAndRedactsConfiguration() throws Exception {
        var calls = new AtomicInteger();
        var binary = fixtureBinary();
        assertThatThrownBy(() -> new WebpProcessCodec(binary, "0".repeat(64), binary, digest(binary),
            Duration.ofSeconds(1), command -> { calls.incrementAndGet(); return process(new byte[0], 0); }))
            .isInstanceOf(RenderCodecException.class).hasMessage("codec-configuration").hasNoCause();
        assertThat(calls).hasValue(0);
    }

    @Test
    void refusesUnknownVersionWithoutFallbackOrExposingItsOutput() throws Exception {
        var binary = fixtureBinary();
        assertThatThrownBy(() -> new WebpProcessCodec(binary, digest(binary), binary, digest(binary),
            Duration.ofSeconds(1), command -> process("provider text and private path".getBytes(), 0)))
            .isInstanceOf(RenderCodecException.class).hasMessage("codec-configuration").hasNoCause();
    }

    @Test
    void rechecksBinaryHashBeforeEveryOperation() throws Exception {
        var calls = new AtomicInteger();
        var codec = codec(command -> { calls.incrementAndGet(); return process("1.6.0\n".getBytes(), 0); });
        Files.writeString(temporary.resolve("executable"), "altered");
        assertThatThrownBy(() -> codec.encode(image(), temporary, POLICY))
            .isInstanceOf(RenderCodecException.class).hasMessage("codec-configuration");
        assertThat(calls).hasValue(2);
        assertThat(files()).containsExactly("executable");
    }

    @Test
    void fixedArgumentsNeverEnableLossyResizeMetadataOrShellAndInvalidOutputIsRemoved() throws Exception {
        var commands = new ArrayList<List<String>>();
        var codec = codec(command -> {
            commands.add(List.copyOf(command));
            return process(command.contains("-version") ? "1.6.0\n".getBytes() : "not a WebP".getBytes(), 0);
        });
        var sentinel = temporary.resolve("unrelated.txt");
        Files.writeString(sentinel, "keep me");
        assertThatThrownBy(() -> codec.encode(image(), temporary, POLICY)).isInstanceOf(RenderCodecException.class);
        var encode = commands.getLast();
        assertThat(encode).containsSubsequence("-quiet", "-lossless", "-exact", "-q", "100", "-m", "0",
            "-metadata", "none", "-o", "-", "--");
        assertThat(encode).doesNotContain("-resize", "-near_lossless", "-mt", "sh", "bash");
        assertThat(files()).containsExactlyInAnyOrder("executable", "unrelated.txt");
        assertThat(Files.readString(sentinel)).isEqualTo("keep me");
    }

    @Test void legacyPolicyKeepsMethodFourInsteadOfBeingRelabeledAsTheNewPolicy() throws Exception {
        var commands = new ArrayList<List<String>>();
        var codec = codec(command -> {
            commands.add(List.copyOf(command));
            return process(command.contains("-version") ? "1.6.0\n".getBytes() : "not a WebP".getBytes(), 0);
        });
        var legacy = new RenderPolicy("clean-box-1.0", POLICY.maxOriginalBytes(), POLICY.maxWidthPx(), POLICY.maxHeightPx(),
            POLICY.maxPixels(), POLICY.maxOutputBytes(), POLICY.maxManifestBytes(), POLICY.minimumFontPx(), POLICY.maximumFontPx(), POLICY.paddingPx());
        assertThatThrownBy(() -> codec.encode(image(), temporary, legacy)).isInstanceOf(RenderCodecException.class);
        assertThat(commands.getLast()).containsSubsequence("-lossless", "-exact", "-q", "100", "-m", "4");
        assertThat(files()).containsExactly("executable");
    }

    @Test
    void stopsBeforeWritingBeyondOutputPolicyAndCleansPartial() throws Exception {
        var strict = new RenderPolicy("fixture", 100, 10, 10, 100, 8, 100, 12, 48, 2);
        var codec = codec(command -> process(command.contains("-version") ? "1.6.0\n".getBytes() : new byte[9], 0));
        assertThatThrownBy(() -> codec.encode(image(), temporary, strict))
            .isInstanceOf(RenderCodecException.class).hasMessage("codec-output-limit");
        assertThat(files()).containsExactly("executable");
    }

    @Test
    void rejectsNonzeroExitWithoutExposingNativeDiagnostic() throws Exception {
        var codec = codec(command -> process(command.contains("-version") ? "1.6.0\n".getBytes() : new byte[0],
            command.contains("-version") ? 0 : 9));
        assertThatThrownBy(() -> codec.encode(image(), temporary, POLICY))
            .isInstanceOf(RenderCodecException.class).hasMessage("codec-unavailable").hasNoCause();
        assertThat(files()).containsExactly("executable");
    }

    @Test
    void processStartFailureIsSanitizedAndCleansOnlyOwnedFiles() throws Exception {
        var codec = codec(command -> {
            if (command.contains("-version")) return process("1.6.0\n".getBytes(), 0);
            throw new IOException("private native path and response");
        });
        assertThatThrownBy(() -> codec.encode(image(), temporary, POLICY))
            .isInstanceOf(RenderCodecException.class).hasMessage("codec-unavailable").hasNoCause();
        assertThat(files()).containsExactly("executable");
    }

    @Test
    void dimensionsFailBeforeSpoolingOrStartingProcessAndRelativePathsAreNotLookedUp() throws Exception {
        var calls = new AtomicInteger();
        var codec = codec(command -> { calls.incrementAndGet(); return process("1.6.0\n".getBytes(), 0); });
        var strict = new RenderPolicy("fixture", 100, 1, 1, 1, 100, 100, 12, 48, 2);
        assertThatThrownBy(() -> codec.encode(image(), temporary, strict)).isInstanceOf(RenderCodecException.class);
        assertThat(calls).hasValue(2);
        assertThat(files()).containsExactly("executable");
        assertThatThrownBy(() -> new WebpProcessCodec(Path.of("cwebp"), "0".repeat(64),
            Path.of("dwebp"), "0".repeat(64), Duration.ofSeconds(1)))
            .isInstanceOf(RenderCodecException.class).hasMessage("codec-configuration");
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -1, 61})
    void refusesInvalidDeadlineWithoutLaunchingNative(int seconds) throws Exception {
        var calls = new AtomicInteger();
        var binary = fixtureBinary();
        assertThatThrownBy(() -> new WebpProcessCodec(binary, digest(binary), binary, digest(binary),
            Duration.ofSeconds(seconds), command -> { calls.incrementAndGet(); return process(new byte[0], 0); }))
            .isInstanceOf(RenderCodecException.class).hasMessage("codec-configuration");
        assertThat(calls).hasValue(0);
    }

    @Test
    void refusesOversizedVersionOutputAndNeverCopiesNativeTextToException() throws Exception {
        var binary = fixtureBinary();
        assertThatThrownBy(() -> new WebpProcessCodec(binary, digest(binary), binary, digest(binary),
            Duration.ofSeconds(1), command -> process(("1.6.0\n" + "secret".repeat(30)).getBytes(), 0)))
            .isInstanceOf(RenderCodecException.class).hasMessage("codec-configuration").hasNoCause();
    }

    @Test
    void timeoutTerminatesProcessBeforeCapacityIsReusableAndRejectsConcurrentWork() throws Exception {
        var entered = new CountDownLatch(1);
        var stopped = new CountDownLatch(1);
        var alive = new AtomicBoolean(true);
        var blocking = mock(Process.class);
        when(blocking.getOutputStream()).thenReturn(OutputStream.nullOutputStream());
        when(blocking.getInputStream()).thenReturn(new InputStream() {
            @Override public int read() {
                entered.countDown();
                try { stopped.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                return -1;
            }
        });
        when(blocking.isAlive()).thenAnswer(invocation -> alive.get());
        when(blocking.destroyForcibly()).thenAnswer(invocation -> { alive.set(false); stopped.countDown(); return blocking; });
        when(blocking.waitFor()).thenAnswer(invocation -> { stopped.await(); return 137; });
        var codec = codec(command -> command.contains("-version") ? process("1.6.0\n".getBytes(), 0) : blocking,
            Duration.ofMillis(500));
        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            var first = executor.submit(() -> codec.encode(image(), temporary, POLICY));
            assertThat(entered.await(3, TimeUnit.SECONDS)).isTrue();
            assertThatThrownBy(() -> codec.encode(image(), temporary, POLICY))
                .isInstanceOf(RenderCodecException.class).hasMessage("codec-busy");
            assertThatThrownBy(() -> first.get(5, TimeUnit.SECONDS)).hasCauseInstanceOf(RenderCodecException.class);
            assertThat(alive).isFalse();
        }
        assertThat(files()).containsExactly("executable");
    }

    private WebpProcessCodec codec(WebpProcessCodec.ProcessStarter starter) throws Exception {
        return codec(starter, Duration.ofSeconds(2));
    }

    private WebpProcessCodec codec(WebpProcessCodec.ProcessStarter starter, Duration timeout) throws Exception {
        var binary = fixtureBinary();
        return new WebpProcessCodec(binary, digest(binary), binary, digest(binary), timeout, starter);
    }

    private Path fixtureBinary() throws Exception {
        var binary = temporary.resolve("executable");
        Files.writeString(binary, "fixture, not executable code");
        assertThat(binary.toFile().setExecutable(true, true)).isTrue();
        return binary;
    }

    private static Process process(byte[] output, int exit) {
        var process = mock(Process.class);
        when(process.getInputStream()).thenReturn(new ByteArrayInputStream(output));
        when(process.getOutputStream()).thenReturn(OutputStream.nullOutputStream());
        try { when(process.waitFor()).thenReturn(exit); }
        catch (InterruptedException impossible) { throw new AssertionError(impossible); }
        when(process.isAlive()).thenReturn(false);
        return process;
    }

    private List<String> files() throws Exception {
        try (var stream = Files.list(temporary)) { return stream.map(path -> path.getFileName().toString()).sorted().toList(); }
    }

    private static BufferedImage image() { return new BufferedImage(2, 2, BufferedImage.TYPE_INT_ARGB); }
    static String digest(Path path) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(Files.readAllBytes(path)));
    }
}
