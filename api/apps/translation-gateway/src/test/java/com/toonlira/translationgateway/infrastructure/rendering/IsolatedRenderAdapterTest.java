package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Duration;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.atomic.AtomicInteger;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class IsolatedRenderAdapterTest {
    @TempDir Path temporary;

    @Test
    void changedOrLongerBorrowedInputIsRejectedBeforeChildLaunchAndOwnedSnapshotIsCleaned() throws Exception {
        var launches = new AtomicInteger();
        var settings = new RenderChildSettings(temporary.resolve("encoder"), "a".repeat(64),
            temporary.resolve("decoder"), "b".repeat(64), Duration.ofSeconds(10));
        var adapter = new IsolatedRenderAdapter(temporary, settings, Duration.ofSeconds(10), 64,
            (directory, heap) -> { launches.incrementAndGet(); throw new IOException("must not launch"); });
        for (boolean longer : List.of(false, true)) {
            var original = original(); var request = request(original); var bytes = Files.readAllBytes(original);
            if (longer) Files.write(original, new byte[] {1}, StandardOpenOption.APPEND);
            else { bytes[0] ^= 1; Files.write(original, bytes); }
            assertThatThrownBy(() -> adapter.render(original, request)).hasMessage("render-invalid-media").hasNoCause();
            assertThat(launches).hasValue(0); assertNoStaging(); Files.delete(original);
        }
    }

    @Test
    void changedMemoryPressureIsRejectedBeforeStagingOrChildLaunchAndCapacityIsReleased() throws Exception {
        long gib = 1024L * 1024 * 1024;
        var snapshot = new AtomicReference<>(new LinuxWorkerMemoryAdmission.Snapshot(1, "0::/", 8 * gib, gib,
            0, 64, "tmpfs", gib / 2, 3 * gib, gib));
        var admission = LinuxWorkerMemoryAdmission.admit(snapshot::get, NativeProcessLimits.initial());
        var launches = new AtomicInteger();
        var settings = new RenderChildSettings(temporary.resolve("encoder"), "a".repeat(64),
            temporary.resolve("decoder"), "b".repeat(64), Duration.ofSeconds(10));
        var adapter = new IsolatedRenderAdapter(temporary, settings, Duration.ofSeconds(10), 64,
            (directory, heap) -> { launches.incrementAndGet(); throw new IOException("private launcher diagnostic"); },
            admission::requireAvailable);
        var original = original();
        var before = Files.readAllBytes(original);
        snapshot.set(new LinuxWorkerMemoryAdmission.Snapshot(1, "0::/", 8 * gib, 5 * gib,
            0, 64, "tmpfs", gib / 2, 3 * gib, gib));
        assertThatThrownBy(() -> adapter.render(original, request(original))).hasMessage("render-configuration").hasNoCause();
        assertThat(launches).hasValue(0);
        assertNoStaging();
        snapshot.set(new LinuxWorkerMemoryAdmission.Snapshot(1, "0::/", 8 * gib, gib,
            0, 64, "tmpfs", gib / 2, 3 * gib, gib));
        assertThatThrownBy(() -> adapter.render(original, request(original))).hasMessage("render-unavailable").hasNoCause();
        assertThat(launches).hasValue(1);
        assertThat(Files.readAllBytes(original)).containsExactly(before);
        assertNoStaging();
    }

    @Test
    void realBlockedJvmIsKilledOnDeadlineAndOnlyOwnedStagingIsRemoved() throws Exception {
        var process = new AtomicReference<Process>();
        var original = original();
        var before = Files.readAllBytes(original);
        var sentinel = Files.writeString(temporary.resolve("keep.txt"), "keep");
        var adapter = adapter("block", Duration.ofSeconds(2), process);
        assertThatThrownBy(() -> adapter.render(original, request(original)))
            .isInstanceOf(RenderFileException.class).hasMessage("render-timeout").hasNoCause();
        assertNoStaging();
        assertThat(process.get().isAlive()).isFalse();
        assertThat(Files.readAllBytes(original)).containsExactly(before);
        assertThat(Files.readString(sentinel)).isEqualTo("keep");
        assertNoStaging();
        assertThatThrownBy(() -> adapter.render(original, request(original))).hasMessage("render-timeout");
        assertNoStaging();
    }

    @Test
    void busyHasNoQueueAndCancellationWaitsForChildDeathBeforeReleasingCapacity() throws Exception {
        var process = new AtomicReference<Process>();
        var ownerThread = new AtomicReference<Thread>();
        var original = original();
        var request = request(original);
        var adapter = adapter("block", Duration.ofSeconds(10), process);
        try (var executor = Executors.newSingleThreadExecutor()) {
            var first = executor.submit(() -> {
                ownerThread.set(Thread.currentThread());
                return adapter.render(original, request);
            });
            awaitProcess(process);
            assertThatThrownBy(() -> adapter.render(original, request)).hasMessage("render-busy");
            ownerThread.get().interrupt();
            assertThatThrownBy(() -> first.get(5, TimeUnit.SECONDS))
                .hasCauseInstanceOf(RenderFileException.class).cause().hasMessage("render-cancelled");
            assertNoStaging();
            assertThat(process.get().isAlive()).isFalse();
        }
        assertNoStaging();
    }

    @Test
    void heapExhaustionCannotTerminateParentJvmOrCorruptOriginal() throws Exception {
        var process = new AtomicReference<Process>();
        var original = original();
        var before = Files.readAllBytes(original);
        assertThatThrownBy(() -> adapter("oom", Duration.ofSeconds(10), process).render(original, request(original)))
            .isInstanceOf(RenderFileException.class).hasMessage("render-unavailable").hasNoCause();
        assertThat(process.get().exitValue()).isNotZero();
        assertThat(Files.readAllBytes(original)).containsExactly(before);
        assertNoStaging();
    }

    @Test
    void malformedOutputAndSymlinkCannotEscapeOwnedDirectoryOrExposeChildDiagnostics() throws Exception {
        var original = original();
        var before = Files.readAllBytes(original);
        for (var mode : List.of("invalid", "symlink")) {
            assertThatThrownBy(() -> adapter(mode, Duration.ofSeconds(10), new AtomicReference<>())
                .render(original, request(original))).hasMessage("render-unavailable").hasNoCause();
            assertThat(Files.readAllBytes(original)).containsExactly(before);
            assertNoStaging();
        }
    }

    @Test
    void launchConfigurationHasHeapBudgetNoCredentialEnvironmentAndNoBusinessArguments() throws Exception {
        var builder = RenderJvmLauncher.builder(temporary.toRealPath(), 64, FixtureChild.class.getName());
        assertThat(builder.environment()).isEmpty();
        assertThat(builder.command()).contains("-Xmx64m", "-XX:+ExitOnOutOfMemoryError", "-Djava.awt.headless=true");
        assertThat(builder.command()).doesNotContain("-jar", "sh", "bash", "Olá, mangá!", "source");
        assertThat(builder.directory().toPath()).isEqualTo(temporary.toRealPath());
        assertThat(builder.redirectError()).isEqualTo(ProcessBuilder.Redirect.DISCARD);
        assertThat(builder.redirectOutput()).isEqualTo(ProcessBuilder.Redirect.DISCARD);
        for (int heap : new int[] {0, 63, 2049}) {
            assertThatThrownBy(() -> RenderJvmLauncher.builder(temporary, heap, FixtureChild.class.getName()))
                .hasMessage("render-configuration").hasNoCause();
        }
    }

    @Test
    void deniedDescendantEnumerationStillKillsOwnedJvmAndSanitizesOsDiagnostic() throws Exception {
        var real = new AtomicReference<Process>();
        var settings = new RenderChildSettings(temporary.resolve("encoder"), "a".repeat(64),
            temporary.resolve("decoder"), "b".repeat(64), Duration.ofSeconds(10));
        var adapter = new IsolatedRenderAdapter(temporary, settings, Duration.ofSeconds(10), 64, (directory, heap) -> {
            var builder = RenderJvmLauncher.builder(directory, heap, FixtureChild.class.getName());
            builder.command().add("block");
            var child = builder.start();
            real.set(child);
            var denied = mock(Process.class);
            when(denied.getOutputStream()).thenReturn(child.getOutputStream());
            when(denied.descendants()).thenThrow(new IllegalStateException("private OS diagnostic"));
            when(denied.isAlive()).thenAnswer(invocation -> child.isAlive());
            when(denied.destroyForcibly()).thenAnswer(invocation -> { child.destroyForcibly(); return denied; });
            try { when(denied.waitFor()).thenAnswer(invocation -> child.waitFor()); }
            catch (InterruptedException impossible) { throw new AssertionError(impossible); }
            return denied;
        });
        var original = original();
        assertThatThrownBy(() -> adapter.render(original, request(original)))
            .isInstanceOf(RenderFileException.class).hasMessage("render-unavailable").hasNoCause();
        assertThat(real.get().isAlive()).isFalse();
        assertNoStaging();
    }

    private IsolatedRenderAdapter adapter(String mode, Duration timeout, AtomicReference<Process> process) {
        var settings = new RenderChildSettings(temporary.resolve("encoder"), "a".repeat(64),
            temporary.resolve("decoder"), "b".repeat(64), Duration.ofSeconds(10));
        return new IsolatedRenderAdapter(temporary, settings, timeout, 64, (directory, heap) -> {
            var builder = RenderJvmLauncher.builder(directory, heap, FixtureChild.class.getName());
            builder.command().add(mode);
            var child = builder.start();
            process.set(child);
            return child;
        });
    }

    private Path original() throws Exception {
        var file = temporary.resolve("original.png");
        assertThat(ImageIO.write(CleanBoxPainterTest.fixture(32, 22, 0xffeeeeee), "png", file.toFile())).isTrue();
        return file;
    }

    private static RenderRequest request(Path original) throws Exception {
        return LocalFileRenderAdapterTest.request(LocalFileRenderAdapterTest.metadata(original), List.of(), RenderPolicy.initial());
    }

    private void assertNoStaging() throws Exception {
        // Error returns at the caller deadline; capacity and files are retained until owned cleanup finishes.
        long end = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
        while (System.nanoTime() < end) {
            boolean staging;
            try (var files = Files.list(temporary)) {
                staging = files.anyMatch(file -> file.getFileName().toString().startsWith("render-jvm-"));
            }
            if (!staging && IsolatedRenderAdapter.isCallCapacityAvailable()) break;
            Thread.sleep(10);
        }
        try (var files = Files.list(temporary)) {
            assertThat(files.map(file -> file.getFileName().toString()).toList()).noneMatch(name -> name.startsWith("render-jvm-"));
        }
        assertThat(IsolatedRenderAdapter.isCallCapacityAvailable()).isTrue();
    }

    private static void awaitProcess(AtomicReference<Process> process) {
        long end = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
        while (process.get() == null && System.nanoTime() < end) Thread.onSpinWait();
        assertThat(process.get()).isNotNull();
    }

    public static final class FixtureChild {
        public static void main(String[] args) throws Exception {
            switch (args[0]) {
                case "block" -> Thread.currentThread().join();
                case "oom" -> {
                    var allocations = new ArrayList<byte[]>();
                    while (true) allocations.add(new byte[8 * 1024 * 1024]);
                }
                case "invalid" -> Files.writeString(Path.of("result.bin"), "private diagnostic and text");
                case "symlink" -> {
                    var envelope = RenderSubprocessProtocol.readRequest(Path.of("request.bin").toAbsolutePath());
                    Files.createSymbolicLink(Path.of("result.bin"), envelope.original());
                }
                default -> throw new IllegalStateException("fixture-only");
            }
        }
    }
}
