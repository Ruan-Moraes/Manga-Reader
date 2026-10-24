package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.application.port.RenderPort;
import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderedImage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class RenderCallSupervisorTest {
    @TempDir Path temporary;

    @Test
    void successfulResultTransfersExactlyOnceAndRunsWithoutInheritedContext() throws Exception {
        var supervisor = new RenderCallSupervisor();
        var output = output();
        var inherited = new InheritableThreadLocal<String>();
        inherited.set("private caller context");
        var discarded = new AtomicBoolean();
        try {
            var actual = supervisor.execute(Duration.ofSeconds(5), started -> {
                assertThat(Thread.currentThread().isVirtual()).isTrue();
                assertThat(inherited.get()).isNull();
                assertThat(System.nanoTime() - started).isGreaterThanOrEqualTo(0);
                return output;
            }, ignored -> discarded.set(true));
            assertThat(actual).isSameAs(output);
            assertThat(Files.exists(output.path())).isTrue();
            assertThat(discarded).isFalse();
            assertThat(supervisor.isAvailable()).isTrue();
        } finally { inherited.remove(); }
    }

    @ParameterizedTest
    @ValueSource(strings = {"timeout", "cancel"})
    void abandonedCallerDoesNotReleaseBusyCapacityOrReceiveLateOutput(String reason) throws Exception {
        var supervisor = new RenderCallSupervisor();
        var entered = new CountDownLatch(1);
        var release = new CountDownLatch(1);
        var discarded = new CountDownLatch(1);
        var owner = new AtomicReference<Thread>();
        var interruptPreserved = new AtomicBoolean();
        var output = output();
        try (var executor = Executors.newSingleThreadExecutor()) {
            var call = executor.submit(() -> {
                owner.set(Thread.currentThread());
                try {
                    return supervisor.execute(reason.equals("timeout") ? Duration.ofMillis(250) : Duration.ofSeconds(5), started -> {
                        entered.countDown();
                        awaitIgnoringInterrupt(release);
                        return output;
                    }, result -> { delete(result); discarded.countDown(); });
                } catch (RenderFileException error) {
                    interruptPreserved.set(Thread.currentThread().isInterrupted());
                    throw error;
                }
            });
            try {
                assertThat(entered.await(2, TimeUnit.SECONDS)).isTrue();
                if (reason.equals("cancel")) owner.get().interrupt();
                assertThatThrownBy(() -> call.get(2, TimeUnit.SECONDS)).hasCauseInstanceOf(RenderFileException.class)
                    .cause().hasMessage("render-" + reason.replace("cancel", "cancelled")).hasNoCause();
                assertThat(interruptPreserved.get()).isEqualTo(reason.equals("cancel"));
                assertThat(supervisor.isAvailable()).isFalse();
                assertThatThrownBy(() -> supervisor.execute(Duration.ofSeconds(1), started -> output, ignored -> { }))
                    .hasMessage("render-busy");
                assertThat(Files.exists(output.path())).isTrue();
            } finally { release.countDown(); }
            assertThat(discarded.await(2, TimeUnit.SECONDS)).isTrue();
            awaitAvailable(supervisor);
            assertThat(Files.exists(output.path())).isFalse();
        }
    }

    @Test
    void blockedLateCleanupKeepsCapacityWhileCallerAlreadyHasTimedOut() throws Exception {
        var supervisor = new RenderCallSupervisor();
        var releaseOperation = new CountDownLatch(1);
        var cleanupEntered = new CountDownLatch(1);
        var releaseCleanup = new CountDownLatch(1);
        var output = output();
        try (var executor = Executors.newSingleThreadExecutor()) {
            var call = executor.submit(() -> supervisor.execute(Duration.ofMillis(250), started -> {
                awaitIgnoringInterrupt(releaseOperation); return output;
            }, result -> {
                cleanupEntered.countDown(); awaitIgnoringInterrupt(releaseCleanup); delete(result);
            }));
            try {
                assertThatThrownBy(() -> call.get(2, TimeUnit.SECONDS)).cause().hasMessage("render-timeout");
                releaseOperation.countDown();
                assertThat(cleanupEntered.await(2, TimeUnit.SECONDS)).isTrue();
                assertThat(supervisor.isAvailable()).isFalse();
                assertThat(Files.exists(output.path())).isTrue();
            } finally { releaseOperation.countDown(); releaseCleanup.countDown(); }
            awaitAvailable(supervisor);
            assertThat(Files.exists(output.path())).isFalse();
        }
    }

    @Test
    void unconfirmedCleanupPoisonsCapacityWithoutReplacingTheCallersDeadlineFailure() throws Exception {
        var supervisor = new RenderCallSupervisor();
        var release = new CountDownLatch(1);
        var cleanup = new CountDownLatch(1);
        var output = output();
        try (var executor = Executors.newSingleThreadExecutor()) {
            var call = executor.submit(() -> supervisor.execute(Duration.ofMillis(250), started -> {
                awaitIgnoringInterrupt(release); return output;
            }, ignored -> { cleanup.countDown(); throw new IllegalStateException("private filesystem diagnostic"); }));
            try { assertThatThrownBy(() -> call.get(2, TimeUnit.SECONDS)).cause().hasMessage("render-timeout"); }
            finally { release.countDown(); }
            assertThat(cleanup.await(2, TimeUnit.SECONDS)).isTrue();
            assertThatThrownBy(() -> supervisor.execute(Duration.ofSeconds(1), started -> output, ignored -> { }))
                .hasMessage("render-busy").hasNoCause();
            assertThat(Files.exists(output.path())).isTrue();
        }
    }

    @Test
    void blockedInterruptSignalCannotBlockCallerOrReleaseCapacityEvenAfterOwnedCleanup() throws Exception {
        var signalEntered = new CountDownLatch(1);
        var releaseSignal = new CountDownLatch(1);
        var operationEntered = new CountDownLatch(1);
        var releaseOperation = new CountDownLatch(1);
        var cleanup = new CountDownLatch(1);
        var supervisor = new RenderCallSupervisor(worker -> {
            signalEntered.countDown();
            awaitIgnoringInterrupt(releaseSignal);
            worker.interrupt();
        });
        var output = output();
        try (var executor = Executors.newSingleThreadExecutor()) {
            var call = executor.submit(() -> supervisor.execute(Duration.ofMillis(250), started -> {
                operationEntered.countDown(); awaitIgnoringInterrupt(releaseOperation); return output;
            }, result -> { delete(result); cleanup.countDown(); }));
            try {
                assertThat(operationEntered.await(2, TimeUnit.SECONDS)).isTrue();
                assertThatThrownBy(() -> call.get(2, TimeUnit.SECONDS)).cause().hasMessage("render-timeout");
                assertThat(signalEntered.await(2, TimeUnit.SECONDS)).isTrue();
                releaseOperation.countDown();
                assertThat(cleanup.await(2, TimeUnit.SECONDS)).isTrue();
                assertThat(Files.exists(output.path())).isFalse();
                assertThat(supervisor.isAvailable()).isFalse();
                assertThatThrownBy(() -> supervisor.execute(Duration.ofSeconds(1), started -> output, ignored -> { }))
                    .hasMessage("render-busy");
            } finally { releaseOperation.countDown(); releaseSignal.countDown(); }
            awaitAvailable(supervisor);
        }
    }

    @Test
    void unknownTerminationFailureKeepsCapacityButOrdinaryFailureIsSanitizedAndReleasesIt() {
        var poisoned = new RenderCallSupervisor();
        assertThatThrownBy(() -> poisoned.execute(Duration.ofSeconds(1), started -> {
            throw new RenderFileException(RenderFileException.Failure.CLEANUP_FAILED);
        }, ignored -> { })).hasMessage("render-cleanup-failed").hasNoCause();
        assertThat(poisoned.isAvailable()).isFalse();
        var healthy = new RenderCallSupervisor();
        assertThatThrownBy(() -> healthy.execute(Duration.ofSeconds(1), started -> {
            throw new IllegalStateException("private text/id/path");
        }, ignored -> { })).hasMessage("render-unavailable").hasNoCause();
        assertThat(healthy.isAvailable()).isTrue();
        assertThat(healthy.toString()).isEqualTo("RenderCallSupervisor[redacted]");
    }

    @Test
    void alreadyInterruptedCallerDoesNotStartWorkAndRetainsItsInterruptFlag() {
        var supervisor = new RenderCallSupervisor();
        var started = new AtomicBoolean();
        Thread.currentThread().interrupt();
        try {
            assertThatThrownBy(() -> supervisor.execute(Duration.ofSeconds(1), ignored -> {
                started.set(true); return null;
            }, ignored -> { })).hasMessage("render-cancelled").hasNoCause();
            assertThat(Thread.currentThread().isInterrupted()).isTrue();
            assertThat(started).isFalse();
            assertThat(supervisor.isAvailable()).isTrue();
        } finally { Thread.interrupted(); }
    }

    @ParameterizedTest
    @ValueSource(longs = {0, -1, 301})
    void invalidDeadlineCannotAdmitWork(long seconds) {
        var supervisor = new RenderCallSupervisor();
        assertThatThrownBy(() -> supervisor.execute(Duration.ofSeconds(seconds), started -> null, ignored -> { }))
            .hasMessage("render-configuration").hasNoCause();
        assertThat(supervisor.isAvailable()).isTrue();
    }

    @Test
    void nullArgumentsOrOutputDoNotTransferOwnershipOrExposeDiagnostics() {
        var supervisor = new RenderCallSupervisor();
        assertThatThrownBy(() -> supervisor.execute(null, started -> null, ignored -> { })).hasMessage("render-configuration");
        assertThatThrownBy(() -> supervisor.execute(Duration.ofSeconds(1), null, ignored -> { })).hasMessage("render-configuration");
        assertThatThrownBy(() -> supervisor.execute(Duration.ofSeconds(1), started -> null, null)).hasMessage("render-configuration");
        assertThatThrownBy(() -> supervisor.execute(Duration.ofSeconds(1), started -> null, ignored -> { }))
            .hasMessage("render-unavailable").hasNoCause();
        assertThat(supervisor.isAvailable()).isTrue();
    }

    private RenderPort.Output output() throws Exception {
        var original = temporary.resolve("original.png");
        assertThat(ImageIO.write(CleanBoxPainterTest.fixture(32, 22, 0xffeeeeee), "png", original.toFile())).isTrue();
        var request = LocalFileRenderAdapterTest.request(LocalFileRenderAdapterTest.metadata(original), List.of(), RenderPolicy.initial());
        var artifact = Files.write(temporary.resolve("render-output.webp"), new byte[] {1, 2, 3});
        // Ownership unit fixture, not a real codec result or quality evidence.
        return new RenderPort.Output(artifact, RenderManifest.create(request,
            new RenderedImage("image/webp", 3, 32, 22, "a".repeat(64)), List.of()));
    }

    private static void delete(RenderPort.Output output) {
        try { Files.delete(output.path()); }
        catch (Exception error) { throw new IllegalStateException("fixture delete failed"); }
    }

    private static void awaitAvailable(RenderCallSupervisor supervisor) throws InterruptedException {
        long end = System.nanoTime() + TimeUnit.SECONDS.toNanos(2);
        while (!supervisor.isAvailable() && System.nanoTime() < end) Thread.sleep(5);
        assertThat(supervisor.isAvailable()).isTrue();
    }

    private static void awaitIgnoringInterrupt(CountDownLatch latch) {
        while (true) {
            try { latch.await(); return; }
            catch (InterruptedException ignored) { }
        }
    }
}
