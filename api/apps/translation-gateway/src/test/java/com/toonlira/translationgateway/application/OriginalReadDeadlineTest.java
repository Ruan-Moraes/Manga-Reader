package com.toonlira.translationgateway.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class OriginalReadDeadlineTest {
    @Test
    void ownerCannotFinishWhileDeadlineCloserStillOwnsTheStream() throws Exception {
        var closeStarted = new CountDownLatch(1);
        var releaseClose = new CountDownLatch(1);
        var finished = new AtomicBoolean();
        var worker = Thread.ofPlatform().start(() -> {
            try (var deadline = OriginalReadDeadline.start(Duration.ofMillis(100));
                 var stream = deadline.guard(new ByteArrayInputStream(new byte[0]) {
                     @Override public void close() throws IOException {
                         closeStarted.countDown();
                         try { releaseClose.await(); }
                         catch (InterruptedException error) { throw new IOException("synthetic-interruption"); }
                     }
                 })) {
                try { new CountDownLatch(1).await(); }
                catch (InterruptedException expected) {
                    if (!closeStarted.await(2, TimeUnit.SECONDS)) throw new AssertionError("closer-not-started");
                }
            } catch (IOException | InterruptedException error) { throw new AssertionError(error); }
            finished.set(true);
        });
        try {
            assertThat(closeStarted.await(2, TimeUnit.SECONDS)).isTrue();
            worker.join(100);
            assertThat(finished).as("stream cleanup remains owned until close actually terminates").isFalse();
        } finally {
            releaseClose.countDown();
            worker.join(2000);
        }
        assertThat(worker.isAlive()).isFalse();
        assertThat(finished).isTrue();
    }

    @Test
    void completedStreamIsNotClosedAgainWhenTheNextReadExpires() throws Exception {
        var firstCloses = new AtomicInteger();
        var secondClosed = new CountDownLatch(1);
        var finished = new AtomicBoolean();
        var worker = Thread.ofPlatform().start(() -> {
            try (var deadline = OriginalReadDeadline.start(Duration.ofMillis(100))) {
                try (var first = deadline.guard(new ByteArrayInputStream(new byte[0]) {
                    @Override public void close() { firstCloses.incrementAndGet(); }
                })) { }
                try (var second = deadline.guard(new ByteArrayInputStream(new byte[0]) {
                    @Override public void close() { secondClosed.countDown(); }
                })) {
                    while (!deadline.expired()) {
                        try { new CountDownLatch(1).await(); }
                        catch (InterruptedException expected) { }
                    }
                    assertThat(secondClosed.await(2, TimeUnit.SECONDS)).isTrue();
                }
                finished.set(true);
            } catch (IOException | InterruptedException error) { throw new AssertionError(error); }
        });
        worker.join(3000);
        assertThat(worker.isAlive()).isFalse();
        assertThat(finished).isTrue();
        assertThat(firstCloses).hasValue(1);
    }

    @Test
    void streamReturnedAfterScopeEndsIsClosedAndRejected() {
        var closed = new AtomicBoolean();
        try (var deadline = OriginalReadDeadline.start(Duration.ofSeconds(1))) {
            deadline.close();
            assertThatThrownBy(() -> deadline.guard(new ByteArrayInputStream(new byte[0]) {
                @Override public void close() { closed.set(true); }
            })).isInstanceOf(IOException.class).hasMessage("original-read-unavailable");
        }
        assertThat(closed).isTrue();
    }

    @Test
    void interruptsOwnedThreadAtDeadline() throws Exception {
        var entered = new CountDownLatch(1);
        var interrupted = new AtomicBoolean();
        var worker = Thread.ofPlatform().start(() -> {
            try (var deadline = OriginalReadDeadline.start(Duration.ofMillis(100))) {
                entered.countDown();
                try { new CountDownLatch(1).await(); }
                catch (InterruptedException expected) { interrupted.set(true); }
            }
        });
        try {
            assertThat(entered.await(2, TimeUnit.SECONDS)).isTrue();
            worker.join(2000);
            assertThat(worker.isAlive()).isFalse();
            assertThat(interrupted).isTrue();
        } finally {
            worker.interrupt();
            worker.join(2000);
        }
    }

    @Test
    void closingPreventsLateInterruptionOfSubsequentWork() throws Exception {
        var completed = new AtomicBoolean();
        var worker = Thread.ofPlatform().start(() -> {
            try (var deadline = OriginalReadDeadline.start(Duration.ofMillis(100))) { }
            try { Thread.sleep(250); completed.set(true); }
            catch (InterruptedException unexpected) { Thread.currentThread().interrupt(); }
        });
        worker.join(2000);
        assertThat(worker.isAlive()).isFalse();
        assertThat(completed).isTrue();
    }
}
