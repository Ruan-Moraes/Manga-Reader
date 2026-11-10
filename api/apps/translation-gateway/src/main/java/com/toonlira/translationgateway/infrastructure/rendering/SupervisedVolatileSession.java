package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.application.port.VolatileSessionPort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.function.Consumer;
import org.springframework.stereotype.Component;

@Component
public class SupervisedVolatileSession implements VolatileSessionPort {
    private final RenderCallSupervisor calls = new RenderCallSupervisor();
    private final Duration deadline;
    public SupervisedVolatileSession() { this(Duration.ofMinutes(5)); }
    SupervisedVolatileSession(Duration deadline) { this.deadline = deadline; }
    @Override public void execute(Consumer<Fence> operation, Runnable cancellation) {
        var abandoned = new AtomicBoolean();
        try {
            var outcome = calls.execute(deadline, started -> {
                Fence fence = () -> {
                    if (abandoned.get() || System.nanoTime() - started >= deadline.toNanos())
                        throw new GatewayException(GatewayErrorCode.CAPABILITIES_UNAVAILABLE, 503, false);
                };
                try { fence.checkActive(); operation.accept(fence); return new Outcome(null); }
                catch (RuntimeException error) { return new Outcome(error); }
            }, ignored -> { }, cancellation, abandoned);
            if (outcome.failure() != null) throw outcome.failure();
        } catch (RenderFileException error) {
            throw new GatewayException(GatewayErrorCode.CAPABILITIES_UNAVAILABLE, 503,
                error.failure() == RenderFileException.Failure.BUSY);
        }
    }
    private record Outcome(RuntimeException failure) {
        @Override public String toString() { return "VolatileSession.Outcome[redacted]"; }
    }
}
