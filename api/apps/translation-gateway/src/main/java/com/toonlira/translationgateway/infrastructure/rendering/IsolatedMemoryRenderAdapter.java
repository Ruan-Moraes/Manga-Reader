package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.UNAVAILABLE;

import com.toonlira.translationgateway.application.port.VolatileRenderPort;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.atomic.AtomicBoolean;

final class IsolatedMemoryRenderAdapter implements VolatileRenderPort {
    // A stopped native child can pin a pipe reader. Keep that reader off the shared
    // virtual scheduler that must still run the deadline and cancellation path.
    private static final RenderCallSupervisor CALLS = new RenderCallSupervisor(Thread::interrupt,
        Thread.ofPlatform().name("native-render-call-", 0).daemon(true).inheritInheritableThreadLocals(false).factory());
    private final Path runtimeDirectory;
    private final BoundedNativeRenderChildSettings settings;
    private final Duration deadline;
    private final Runnable admission;
    private final ChildLauncher launcher;
    /** Runs in this (parent) process on the windows the child records; null = no inpainting. */
    private final InpaintModel inpaintModel;
    IsolatedMemoryRenderAdapter(Path runtimeDirectory, BoundedNativeRenderChildSettings settings, Duration deadline, Runnable admission) {
        this(runtimeDirectory, settings, deadline, admission, IsolatedMemoryRenderAdapter::launchChild);
    }
    /** The production renderer; {@code inpaintModel} null renders in one pass without inpainting. */
    static IsolatedMemoryRenderAdapter withInpainting(Path runtimeDirectory, BoundedNativeRenderChildSettings settings, Duration deadline,
                                                      Runnable admission, InpaintModel inpaintModel) {
        return new IsolatedMemoryRenderAdapter(runtimeDirectory, settings, deadline, admission, IsolatedMemoryRenderAdapter::launchChild, inpaintModel);
    }
    IsolatedMemoryRenderAdapter(Path runtimeDirectory, BoundedNativeRenderChildSettings settings, Duration deadline, Runnable admission, ChildLauncher launcher) {
        this(runtimeDirectory, settings, deadline, admission, launcher, null);
    }
    IsolatedMemoryRenderAdapter(Path runtimeDirectory, BoundedNativeRenderChildSettings settings, Duration deadline, Runnable admission,
                                ChildLauncher launcher, InpaintModel inpaintModel) {
        if (runtimeDirectory == null || !runtimeDirectory.isAbsolute() || settings == null || admission == null
            || launcher == null
            || deadline == null || deadline.isNegative() || deadline.isZero() || deadline.compareTo(Duration.ofMinutes(5)) > 0)
            throw new RenderFileException(RenderFileException.Failure.CONFIGURATION);
        this.runtimeDirectory = runtimeDirectory; this.settings = settings; this.deadline = deadline; this.admission = admission; this.launcher = launcher;
        this.inpaintModel = inpaintModel;
    }

    @Override public void requireAvailable() {
        admission.run();
        if (!CALLS.isAvailable()) throw new RenderFileException(RenderFileException.Failure.BUSY);
    }

    @Override public Output render(byte[] original, RenderRequest request) {
        var child = new AtomicReference<Process>();
        var abandoned = new AtomicBoolean();
        return CALLS.execute(deadline, started -> passes(original, request, child, abandoned, started), Output::close, () -> {
            var process = child.get();
            if (process != null) process.destroyForcibly();
        }, abandoned);
    }

    /**
     * Speech over artwork: a recording pass returns the windows to fill, the model runs here on them (never on the
     * encoded page), and a second child pass applies the answers. The first result is discarded only after that.
     */
    private Output passes(byte[] original, RenderRequest request, AtomicReference<Process> child, AtomicBoolean abandoned, long started) {
        if (inpaintModel == null)
            return execute(original, request, child, abandoned, started, VolatileRenderProtocol.Inpaint.NONE, List.of(), List.of()).output();
        var first = execute(original, request, child, abandoned, started, VolatileRenderProtocol.Inpaint.RECORD, List.of(), List.of());
        if (first.windows().isEmpty()) return first.output();
        List<byte[]> patches;
        try {
            patches = InpaintExchange.answer(first.windows(), inpaintModel,
                () -> !abandoned.get() && !Thread.currentThread().isInterrupted() && System.nanoTime() - started < deadline.toNanos());
        } catch (IOException | RuntimeException failed) {
            // No answer in time: the first pass (lettering kept over the art) is the result.
            return first.output();
        }
        var second = execute(original, request, child, abandoned, started, VolatileRenderProtocol.Inpaint.REPLAY, first.windows(), patches);
        first.output().close();
        return second.output();
    }

    private VolatileRenderProtocol.Rendered execute(byte[] original, RenderRequest request, AtomicReference<Process> child,
                                                    AtomicBoolean abandoned, long started, VolatileRenderProtocol.Inpaint inpaint,
                                                    List<InpaintWindow> windows, List<byte[]> patches) {
        Process process = null;
        byte[] owned = null;
        VolatileRenderProtocol.Rendered result = null;
        boolean transferred = false;
        Thread writer = null;
        OwnedRenderRuntime runtime = null;
        var writeError = new AtomicReference<Throwable>();
        try {
            checkActive(abandoned, started);
            admission.run();
            checkActive(abandoned, started);
            runtime = OwnedRenderRuntime.create(runtimeDirectory);
            checkActive(abandoned, started);
            owned = original.clone();
            checkActive(abandoned, started);
            process = launcher.start(runtime.directory(), settings);
            child.set(process);
            checkActive(abandoned, started);
            var running = process;
            var bytes = owned;
            writer = Thread.ofVirtual().start(() -> {
                try (var output = new DataOutputStream(running.getOutputStream())) {
                    checkActive(abandoned, started);
                    VolatileRenderProtocol.writeRequest(output, bytes, request, settings, inpaint, windows, patches);
                } catch (Throwable error) { writeError.set(error); running.destroyForcibly(); }
                finally { Arrays.fill(bytes, (byte) 0); }
            });
            result = VolatileRenderProtocol.readResult(new DataInputStream(process.getInputStream()), request,
                inpaint == VolatileRenderProtocol.Inpaint.RECORD);
            checkActive(abandoned, started);
            if (!process.waitFor(deadline.toMillis(), TimeUnit.MILLISECONDS) || process.exitValue() != 0 || writeError.get() != null)
                throw new RenderFileException(UNAVAILABLE);
            writer.join();
            transferred = true;
            return result;
        } catch (IOException | InterruptedException error) {
            if (error instanceof InterruptedException) Thread.currentThread().interrupt();
            throw new RenderFileException(UNAVAILABLE);
        } finally {
            boolean interrupted = Thread.interrupted();
            try {
                if (process != null) OwnedRenderProcess.stop(process, new LinkedHashSet<>());
                interrupted |= Thread.interrupted();
                if (writer != null) while (writer.isAlive()) {
                    try { writer.join(); } catch (InterruptedException ignored) { interrupted = true; }
                }
                if (runtime != null) runtime.close();
            } catch (RuntimeException error) {
                if (result != null) result.output().close();
                throw new RenderFileException(RenderFileException.Failure.CLEANUP_FAILED);
            } finally {
                if (owned != null && (writer == null || !writer.isAlive())) Arrays.fill(owned, (byte) 0);
                if (!transferred && result != null) result.output().close();
                if (interrupted) Thread.currentThread().interrupt();
            }
        }
    }

    private void checkActive(AtomicBoolean abandoned, long started) {
        if (abandoned.get() || System.nanoTime() - started >= deadline.toNanos() || Thread.currentThread().isInterrupted())
            throw new RenderFileException(RenderFileException.Failure.TIMEOUT);
    }
    private static Process launchChild(Path directory, BoundedNativeRenderChildSettings settings) throws IOException {
        return RenderJvmLauncher.builder(directory, 256, VolatileRenderChildMain.class.getName(), settings)
            .redirectError(ProcessBuilder.Redirect.DISCARD).redirectOutput(ProcessBuilder.Redirect.PIPE).start();
    }
    @FunctionalInterface interface ChildLauncher {
        Process start(Path directory, BoundedNativeRenderChildSettings settings) throws IOException;
    }
}
