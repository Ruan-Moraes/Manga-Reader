package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.BUSY;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CANCELLED;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CLEANUP_FAILED;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.TIMEOUT;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.UNAVAILABLE;

import com.toonlira.translationgateway.application.port.RenderPort;
import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;
import java.util.function.LongFunction;

/** Bounded caller wait, separate from owned cleanup. Not a kernel/native/filesystem sandbox. */
final class RenderCallSupervisor {
    private static final Duration MAX_DEADLINE = Duration.ofMinutes(5);
    private final Semaphore capacity = new Semaphore(1);
    private final Consumer<Thread> cancellationSignal;

    RenderCallSupervisor() { this(Thread::interrupt); }
    RenderCallSupervisor(Consumer<Thread> cancellationSignal) {
        if (cancellationSignal == null) throw new RenderFileException(CONFIGURATION);
        this.cancellationSignal = cancellationSignal;
    }

    RenderPort.Output execute(Duration deadline, LongFunction<RenderPort.Output> operation,
                              Consumer<RenderPort.Output> discard) {
        if (deadline == null || deadline.isZero() || deadline.isNegative() || deadline.compareTo(MAX_DEADLINE) > 0
            || operation == null || discard == null) throw new RenderFileException(CONFIGURATION);
        if (Thread.currentThread().isInterrupted()) throw new RenderFileException(CANCELLED);
        if (!capacity.tryAcquire()) throw new RenderFileException(BUSY);
        var call = new Call(deadline.toNanos());
        try {
            call.worker = Thread.ofVirtual().name("render-call-supervisor").inheritInheritableThreadLocals(false)
                .unstarted(() -> call.run(operation, discard));
            call.worker.start();
        } catch (Throwable error) {
            call.release();
            throw new RenderFileException(UNAVAILABLE);
        }
        try {
            long remaining = call.remaining();
            if (remaining <= 0 || !call.ready.await(remaining, TimeUnit.NANOSECONDS)) {
                call.abandon();
                throw new RenderFileException(TIMEOUT);
            }
            return call.take();
        } catch (InterruptedException error) {
            call.abandon();
            Thread.currentThread().interrupt();
            throw new RenderFileException(CANCELLED);
        }
    }

    boolean isAvailable() { return capacity.availablePermits() == 1; }
    @Override public String toString() { return "RenderCallSupervisor[redacted]"; }

    private final class Call {
        private final long started = System.nanoTime();
        private final long deadlineNanos;
        private final CountDownLatch ready = new CountDownLatch(1);
        private final CountDownLatch decided = new CountDownLatch(1);
        private final CountDownLatch cancellationFinished = new CountDownLatch(1);
        private final AtomicBoolean released = new AtomicBoolean();
        private Thread worker;
        private RenderPort.Output output;
        private RenderFileException failure;
        private boolean abandoned;
        private boolean accepted;
        private boolean cancellationRequested;

        private Call(long deadlineNanos) { this.deadlineNanos = deadlineNanos; }
        private long remaining() { return deadlineNanos - (System.nanoTime() - started); }

        private void run(LongFunction<RenderPort.Output> operation, Consumer<RenderPort.Output> discard) {
            RenderPort.Output candidate;
            try {
                if (Thread.currentThread().isInterrupted()) throw new RenderFileException(CANCELLED);
                if (remaining() <= 0) throw new RenderFileException(TIMEOUT);
                candidate = operation.apply(started);
                if (candidate == null) throw new RenderFileException(UNAVAILABLE);
            } catch (Throwable error) {
                var sanitized = error instanceof RenderFileException known ? known : new RenderFileException(UNAVAILABLE);
                // Unknown termination or filesystem cleanup must never admit another concurrent render.
                if (sanitized.failure() != CLEANUP_FAILED) release();
                synchronized (this) { failure = sanitized; }
                ready.countDown();
                return;
            }
            synchronized (this) { output = candidate; }
            ready.countDown();
            try {
                long remaining = remaining();
                if (remaining > 0) decided.await(remaining, TimeUnit.NANOSECONDS);
            } catch (InterruptedException ignored) {
                // This private worker has no caller interrupt to preserve; only the ownership decision matters.
            }
            synchronized (this) {
                if (accepted) { release(); return; }
                abandoned = true;
            }
            Thread.interrupted();
            try {
                discard.accept(candidate);
                release();
            } catch (Throwable ignored) {
                // Caller already has timeout/cancellation. Failed cleanup poisons capacity, with no raw diagnostic.
            }
        }

        private synchronized RenderPort.Output take() {
            if (Thread.currentThread().isInterrupted()) {
                abandon();
                throw new RenderFileException(CANCELLED);
            }
            if (remaining() <= 0 || abandoned) {
                abandon();
                throw new RenderFileException(TIMEOUT);
            }
            if (failure != null) throw failure;
            if (output == null) throw new RenderFileException(UNAVAILABLE);
            accepted = true;
            decided.countDown();
            // operation has returned after its process/file cleanup; output ownership changes atomically here.
            release();
            return output;
        }

        private void abandon() {
            synchronized (this) {
                if (accepted) return;
                abandoned = true;
                decided.countDown();
                if (cancellationRequested || released.get()) return;
                cancellationRequested = true;
            }
            try {
                Thread.ofVirtual().name("render-cancel-signal").inheritInheritableThreadLocals(false).start(() -> {
                    try { cancellationSignal.accept(worker); }
                    catch (Throwable ignored) { /* The operation still owns capacity and must finish/clean up. */ }
                    finally { cancellationFinished.countDown(); }
                });
            } catch (Throwable ignored) {
                // Failed signal startup must not expose a raw diagnostic or release a still-running operation.
                cancellationFinished.countDown();
            }
        }

        private void release() {
            while (true) {
                synchronized (this) {
                    if (released.get()) return;
                    if (!cancellationRequested || cancellationFinished.getCount() == 0) {
                        if (released.compareAndSet(false, true)) capacity.release();
                        return;
                    }
                }
                // Only the private worker can reach this wait. An accepted caller never starts cancellation.
                try { cancellationFinished.await(); }
                catch (InterruptedException ignored) { }
            }
        }
    }
}
