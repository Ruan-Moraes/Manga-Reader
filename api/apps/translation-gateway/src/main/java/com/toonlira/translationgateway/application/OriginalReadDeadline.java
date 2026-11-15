package com.toonlira.translationgateway.application;

import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

/** Cancels active reads at the deadline; ownership stays with the owner until I/O actually terminates. */
final class OriginalReadDeadline implements AutoCloseable {
    private final Thread owner;
    private final CountDownLatch closedSignal = new CountDownLatch(1);
    private boolean closed;
    private boolean expired;
    private BoundInput active;

    private OriginalReadDeadline(Duration remaining) {
        if (remaining == null || remaining.isZero() || remaining.isNegative()
            || remaining.compareTo(Duration.ofHours(1)) > 0) throw new IllegalArgumentException("invalid-original-deadline");
        owner = Thread.currentThread();
        Thread.ofVirtual().name("original-read-deadline").inheritInheritableThreadLocals(false).start(() -> {
            try {
                if (closedSignal.await(remaining.toNanos(), TimeUnit.NANOSECONDS)) return;
                BoundInput pending;
                synchronized (this) {
                    if (closed) return;
                    expired = true;
                    pending = active;
                    owner.interrupt();
                }
                // Closing may itself block. Never hold the deadline monitor or release the owner's snapshot here.
                if (pending != null) pending.closeQuietly();
            } catch (InterruptedException ignored) {
                // The private timer does not transfer interruption to the owner.
            }
        });
    }

    static OriginalReadDeadline start(Duration remaining) { return new OriginalReadDeadline(remaining); }

    synchronized boolean expired() { return expired; }

    InputStream guard(InputStream input) throws IOException {
        var bound = new BoundInput(input);
        synchronized (this) {
            if (!closed && !expired && active == null) {
                active = bound;
                return bound;
            }
        }
        bound.close();
        throw new IOException("original-read-unavailable");
    }

    @Override public synchronized void close() {
        closed = true;
        closedSignal.countDown();
    }

    private final class BoundInput extends FilterInputStream {
        private boolean released;

        private BoundInput(InputStream input) { super(input); }

        @Override public synchronized void close() throws IOException {
            if (released) return;
            synchronized (OriginalReadDeadline.this) {
                if (active == this) active = null;
            }
            in.close();
            released = true;
        }

        private void closeQuietly() {
            try { close(); }
            catch (IOException | RuntimeException ignored) { /* The owner still fails and retains cleanup responsibility. */ }
        }
    }
}
