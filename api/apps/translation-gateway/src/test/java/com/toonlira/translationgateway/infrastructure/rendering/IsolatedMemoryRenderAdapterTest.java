package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.rendering.InMemoryMedia;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import java.io.DataInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/** Real JVM/pipes and owned termination. Synthetic bytes test supervision, not image decoding or native budgets. */
class IsolatedMemoryRenderAdapterTest {
    @TempDir Path runtime;
    private final byte[] original = new byte[2 * 1024 * 1024];
    private final AtomicReference<Process> process = new AtomicReference<>();
    private final AtomicReference<String> mode = new AtomicReference<>("block");
    private final AtomicInteger launches = new AtomicInteger();
    private final CountDownLatch launched = new CountDownLatch(1);

    @Test void timeoutTerminatesARealBlockedChildAndRetainsCapacityThroughPipeCleanup() throws Exception {
        original[0] = 7;
        var renderer = renderer(Duration.ofSeconds(3));
        assertThatThrownBy(() -> renderer.render(original, request()))
            .isInstanceOfSatisfying(RenderFileException.class, failure -> assertThat(failure.failure()).isEqualTo(RenderFileException.Failure.TIMEOUT));
        assertThat(process.get()).isNotNull();
        awaitReleased(renderer);
        assertThat(process.get().isAlive()).isFalse();
        assertThat(original[0]).isEqualTo((byte) 7);
        provesNextLaunchAndNoContentFiles(renderer);
    }

    @Test void busyHasNoQueueAndCallerInterruptionStopsTheOwnedJvmBeforeReuse() throws Exception {
        var renderer = renderer(Duration.ofSeconds(10));
        var failure = new AtomicReference<RenderFileException>();
        var caller = Thread.ofVirtual().start(() -> {
            try { renderer.render(original, request()); }
            catch (RenderFileException error) { failure.set(error); }
        });
        assertThat(launched.await(5, TimeUnit.SECONDS)).isTrue();
        assertThatThrownBy(renderer::requireAvailable).isInstanceOfSatisfying(RenderFileException.class,
            error -> assertThat(error.failure()).isEqualTo(RenderFileException.Failure.BUSY));
        caller.interrupt(); caller.join(5_000);
        assertThat(caller.isAlive()).isFalse();
        assertThat(failure.get().failure()).isEqualTo(RenderFileException.Failure.CANCELLED);
        awaitReleased(renderer);
        assertThat(process.get().isAlive()).isFalse();
        provesNextLaunchAndNoContentFiles(renderer);
    }

    @Test void childHeapExhaustionCannotKillParentOrCreateAHeapDumpAndCapacityRecovers() throws Exception {
        mode.set("oom"); original[0] = 7;
        var renderer = renderer(Duration.ofSeconds(10));
        assertThatThrownBy(() -> renderer.render(original, request())).isInstanceOf(RenderFileException.class).hasNoCause();
        awaitReleased(renderer);
        assertThat(process.get().isAlive()).isFalse();
        assertThat(process.get().exitValue()).isEqualTo(3);
        assertThat(original[0]).isEqualTo((byte) 7);
        provesNextLaunchAndNoContentFiles(renderer);
    }

    @Test void lateAdmissionThatSwallowsInterruptCannotStartAChildAfterTimeout() throws Exception {
        var entered = new CountDownLatch(1); var release = new CountDownLatch(1); var completed = new CountDownLatch(1);
        var settings = new BoundedNativeRenderChildSettings(new NativeRenderChildSettings(Path.of("/not-loaded/libwebp.so"), "a".repeat(64),
            Path.of("/not-loaded/libsharpyuv.so"), "b".repeat(64), Duration.ofSeconds(60)), NativeProcessLimits.initial());
        var renderer = new IsolatedMemoryRenderAdapter(runtime, settings, Duration.ofMillis(250), () -> {
            if (entered.getCount() == 0) return;
            entered.countDown();
            while (true) { try { release.await(); break; } catch (InterruptedException ignored) { } }
            completed.countDown();
        }, (directory, limits) -> { launches.incrementAndGet(); throw new java.io.IOException("Synthetic unexpected late launch"); });
        try {
            assertThatThrownBy(() -> renderer.render(original, request())).isInstanceOfSatisfying(RenderFileException.class,
                error -> assertThat(error.failure()).isEqualTo(RenderFileException.Failure.TIMEOUT));
            assertThat(entered.getCount()).isZero();
            assertThatThrownBy(renderer::requireAvailable).isInstanceOfSatisfying(RenderFileException.class,
                error -> assertThat(error.failure()).isEqualTo(RenderFileException.Failure.BUSY));
        } finally { release.countDown(); }
        assertThat(completed.await(5, TimeUnit.SECONDS)).isTrue();
        awaitReleased(renderer);
        assertThat(launches).hasValue(0);
        try (var files = Files.list(runtime)) { assertThat(files.toList()).isEmpty(); }
    }

    private IsolatedMemoryRenderAdapter renderer(Duration deadline) {
        var settings = new BoundedNativeRenderChildSettings(new NativeRenderChildSettings(Path.of("/not-loaded/libwebp.so"), "a".repeat(64),
            Path.of("/not-loaded/libsharpyuv.so"), "b".repeat(64), Duration.ofSeconds(60)), NativeProcessLimits.initial());
        return new IsolatedMemoryRenderAdapter(runtime, settings, deadline, () -> { }, (directory, limits) -> {
            var builder = RenderJvmLauncher.builder(directory, 64, FaultChild.class.getName(), limits);
            builder.command().add(mode.get());
            var child = builder.redirectError(ProcessBuilder.Redirect.DISCARD).redirectOutput(ProcessBuilder.Redirect.PIPE).start();
            process.set(child); launches.incrementAndGet(); launched.countDown();
            return child;
        });
    }
    private RenderRequest request() {
        return LocalFileRenderAdapterTest.request(new RenderSource("image/png", original.length, 32, 16, InMemoryMedia.sha256(original)), List.of(), RenderPolicy.initial());
    }
    private void provesNextLaunchAndNoContentFiles(IsolatedMemoryRenderAdapter renderer) throws Exception {
        mode.set("malformed");
        assertThatThrownBy(() -> renderer.render(original, request())).isInstanceOf(RenderFileException.class).hasNoCause();
        awaitReleased(renderer);
        assertThat(launches).hasValue(2);
        assertThat(process.get().isAlive()).isFalse();
        try (var files = Files.list(runtime)) { assertThat(files.toList()).isEmpty(); }
    }
    private static void awaitReleased(IsolatedMemoryRenderAdapter renderer) throws Exception {
        long until = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
        while (true) {
            try { renderer.requireAvailable(); return; }
            catch (RenderFileException busy) {
                if (busy.failure() != RenderFileException.Failure.BUSY || System.nanoTime() >= until) throw busy;
                Thread.sleep(10);
            }
        }
    }
    public static final class FaultChild {
        public static void main(String[] args) throws Exception {
            Files.writeString(Path.of(System.getProperty("java.io.tmpdir")).resolve("runtime.fixture"), "synthetic JVM runtime asset");
            var input = new DataInputStream(System.in);
            var request = VolatileRenderProtocol.readSettings(input);
            switch (args[0]) {
                case "block" -> { while (true) Thread.sleep(60_000); }
                case "oom" -> { var retained = new ArrayList<byte[]>(); while (true) retained.add(new byte[8 * 1024 * 1024]); }
                case "malformed" -> {
                    var bytes = VolatileRenderProtocol.readFrame(input, (int) request.policy().maxOriginalBytes());
                    java.util.Arrays.fill(bytes, (byte) 0);
                    System.out.write(new byte[]{0, 0, 0, 0}); System.out.flush();
                }
                default -> throw new IllegalArgumentException();
            }
        }
    }
}
