package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.*;

import com.toonlira.translationgateway.domain.GatewayException;
import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.Test;

class SupervisedVolatileSessionTest {
    @Test void interruptionPrecedesBlockingCloseAndCapacityWaitsForBothOwners() throws Exception {
        var sessions = new SupervisedVolatileSession(Duration.ofMillis(100));
        var stopped = new CountDownLatch(1); var finishClose = new CountDownLatch(1);
        try {
            assertThatThrownBy(() -> sessions.execute(fence -> {
                try { new CountDownLatch(1).await(); }
                catch (InterruptedException expected) { stopped.countDown(); }
            }, () -> {
                boolean interrupted = Thread.interrupted();
                while (finishClose.getCount() > 0) {
                    try { finishClose.await(); } catch (InterruptedException ignored) { interrupted = true; }
                }
                if (interrupted) Thread.currentThread().interrupt();
            })).isInstanceOf(GatewayException.class);
            assertThat(stopped.await(1, TimeUnit.SECONDS)).isTrue();
            assertThatThrownBy(() -> sessions.execute(fence -> fail("Close still owns capacity"), () -> { }))
                .isInstanceOf(GatewayException.class);
        } finally { finishClose.countDown(); }
    }

    @Test void lateOperationCannotStartNextStageAfterConsumingTheInterrupt() throws Exception {
        var sessions = new SupervisedVolatileSession(Duration.ofMillis(100));
        var finish = new CountDownLatch(1);
        var ended = new CountDownLatch(1);
        var nextStage = new AtomicBoolean();
        try {
            assertThatThrownBy(() -> sessions.execute(fence -> {
                try {
                    while (finish.getCount() > 0) {
                        try { finish.await(); } catch (InterruptedException ignored) { }
                    }
                    Thread.interrupted();
                    fence.checkActive();
                    nextStage.set(true);
                } finally { ended.countDown(); }
            }, () -> { })).isInstanceOf(GatewayException.class);
        } finally { finish.countDown(); }
        assertThat(ended.await(1, TimeUnit.SECONDS)).isTrue();
        assertThat(nextStage).isFalse();
    }

    @Test void timeoutDoesNotReleaseCapacityWhileOperationIgnoresInterruption() throws Exception {
        var sessions = new SupervisedVolatileSession(Duration.ofMillis(100));
        var finish = new CountDownLatch(1);
        var cancelled = new CountDownLatch(1);
        var returned = new CountDownLatch(1);
        try {
            assertThatThrownBy(() -> sessions.execute(fence -> {
                while (finish.getCount() > 0) {
                    try { finish.await(); } catch (InterruptedException ignored) { }
                }
                returned.countDown();
            }, cancelled::countDown)).isInstanceOf(GatewayException.class);
            assertThat(cancelled.await(1, TimeUnit.SECONDS)).isTrue();
            assertThatThrownBy(() -> sessions.execute(fence -> fail("Still occupied"), () -> { })).isInstanceOf(GatewayException.class);
        } finally { finish.countDown(); }
        assertThat(returned.await(1, TimeUnit.SECONDS)).isTrue();
        var admitted = new AtomicBoolean();
        for (int retry = 0; retry < 100 && !admitted.get(); retry++) {
            try { sessions.execute(fence -> admitted.set(true), () -> { }); }
            catch (GatewayException occupied) { Thread.sleep(5); }
        }
        assertThat(admitted).isTrue();
    }
    @Test void preservesSanitizedDomainFailureAndNeverRunsAnAutomaticRetry() {
        var sessions = new SupervisedVolatileSession(Duration.ofSeconds(1));
        var calls = new java.util.concurrent.atomic.AtomicInteger();
        assertThatThrownBy(() -> sessions.execute(fence -> {
            calls.incrementAndGet(); throw new IllegalStateException("controlled");
        }, () -> { })).isInstanceOf(IllegalStateException.class).hasMessage("controlled");
        assertThat(calls).hasValue(1);
    }
}
