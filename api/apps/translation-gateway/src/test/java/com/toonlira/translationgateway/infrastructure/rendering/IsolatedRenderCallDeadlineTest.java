package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class IsolatedRenderCallDeadlineTest {
    @TempDir Path temporary;

    @Test
    void timedOutCallerCanDeleteBorrowedInputWithoutDeletingTheLateChildsOwnedSnapshot() throws Exception {
        var entered = new CountDownLatch(1); var release = new CountDownLatch(1);
        var lateProcess = new AtomicReference<Process>(); var childInput = new AtomicReference<Path>();
        var original = temporary.resolve("borrowed.png");
        assertThat(ImageIO.write(CleanBoxPainterTest.fixture(32, 22, 0xffeeeeee), "png", original.toFile())).isTrue();
        var bytes = Files.readAllBytes(original);
        var request = LocalFileRenderAdapterTest.request(LocalFileRenderAdapterTest.metadata(original), List.of(), RenderPolicy.initial());
        var settings = new RenderChildSettings(temporary.resolve("encoder"), "a".repeat(64),
            temporary.resolve("decoder"), "b".repeat(64), Duration.ofSeconds(10));
        var adapter = new IsolatedRenderAdapter(temporary, settings, Duration.ofMillis(500), 64, (directory, heap) -> {
            childInput.set(RenderSubprocessProtocol.readRequest(directory.resolve("request.bin")).original());
            entered.countDown(); awaitIgnoringInterrupt(release);
            var builder = RenderJvmLauncher.builder(directory, heap, IsolatedRenderAdapterTest.FixtureChild.class.getName());
            builder.command().add("block"); var process = builder.start(); lateProcess.set(process); return process;
        });
        try (var executor = Executors.newSingleThreadExecutor()) {
            var call = executor.submit(() -> adapter.render(original, request));
            try {
                assertThat(entered.await(2, TimeUnit.SECONDS)).isTrue();
                assertThatThrownBy(() -> call.get(2, TimeUnit.SECONDS)).cause().hasMessage("render-timeout");
                Files.delete(original);
                assertThat(childInput.get()).isNotEqualTo(original).exists();
                assertThat(Files.readAllBytes(childInput.get())).containsExactly(bytes);
                assertThatThrownBy(() -> adapter.render(original, request)).hasMessage("render-busy");
            } finally { release.countDown(); }
            awaitLateCleanup(lateProcess);
            assertThat(childInput.get()).doesNotExist();
        }
    }

    @Test
    void unresponsiveLauncherCannotKeepCallerPastDeadlineOrReleaseCapacityBeforeLateChildDies() throws Exception {
        var entered = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var lateProcess = new AtomicReference<Process>();
        var original = temporary.resolve("original.png");
        assertThat(ImageIO.write(CleanBoxPainterTest.fixture(32, 22, 0xffeeeeee), "png", original.toFile())).isTrue();
        var before = Files.readAllBytes(original);
        var request = LocalFileRenderAdapterTest.request(LocalFileRenderAdapterTest.metadata(original), List.of(), RenderPolicy.initial());
        var settings = new RenderChildSettings(temporary.resolve("encoder"), "a".repeat(64),
            temporary.resolve("decoder"), "b".repeat(64), Duration.ofSeconds(10));
        var adapter = new IsolatedRenderAdapter(temporary, settings, Duration.ofMillis(250), 64, (directory, heap) -> {
            entered.countDown();
            awaitIgnoringInterrupt(release);
            var builder = RenderJvmLauncher.builder(directory, heap, IsolatedRenderAdapterTest.FixtureChild.class.getName());
            builder.command().add("block");
            var child = builder.start();
            lateProcess.set(child);
            return child;
        });
        try (var executor = Executors.newSingleThreadExecutor()) {
            var call = executor.submit(() -> adapter.render(original, request));
            try {
                assertThat(entered.await(2, TimeUnit.SECONDS)).isTrue();
                assertThatThrownBy(() -> call.get(2, TimeUnit.SECONDS)).hasCauseInstanceOf(RenderFileException.class)
                    .cause().hasMessage("render-timeout");
                assertThat(lateProcess.get()).isNull();
                assertThatThrownBy(() -> adapter.render(original, request)).hasMessage("render-busy");
            } finally { release.countDown(); }
            awaitLateCleanup(lateProcess);
            assertThat(Files.readAllBytes(original)).containsExactly(before);
        }
    }

    private void awaitLateCleanup(AtomicReference<Process> process) throws Exception {
        long end = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
        while (System.nanoTime() < end) {
            boolean staging;
            try (var files = Files.list(temporary)) {
                staging = files.anyMatch(file -> file.getFileName().toString().startsWith("render-jvm-"));
            }
            if (process.get() != null && !process.get().isAlive() && !staging && IsolatedRenderAdapter.isCallCapacityAvailable()) return;
            Thread.sleep(10);
        }
        assertThat(process.get()).isNotNull();
        assertThat(process.get().isAlive()).isFalse();
        assertThat(IsolatedRenderAdapter.isCallCapacityAvailable()).isTrue();
        try (var files = Files.list(temporary)) {
            assertThat(files.map(file -> file.getFileName().toString()).toList()).noneMatch(name -> name.startsWith("render-jvm-"));
        }
    }

    private static void awaitIgnoringInterrupt(CountDownLatch latch) {
        boolean interrupted = false;
        while (true) {
            try { latch.await(); break; }
            catch (InterruptedException error) { interrupted = true; }
        }
        if (interrupted) Thread.currentThread().interrupt();
    }
}
