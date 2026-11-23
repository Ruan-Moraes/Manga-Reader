package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CLEANUP_FAILED;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.UNAVAILABLE;

import com.toonlira.translationgateway.application.RenderingPersistenceUseCase;
import com.toonlira.translationgateway.application.LifecycleCleanupPersistenceUseCase;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.RenderingJobRepository;
import com.toonlira.translationgateway.application.port.RenderingTaskProcessPort;
import com.toonlira.translationgateway.application.port.LifecycleCleanupRepository;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.OriginalObjectKey;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.rendering.ResultObjectKey;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.io.IOException;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.concurrent.atomic.AtomicReference;

/** Shares the render supervisor and admission; storage never runs in this supervising JVM. */
final class StorageBackedRenderingTaskProcess implements RenderingTaskProcessPort {
    private final GatewayProperties properties;
    private final NativeRenderChildSettings codec;
    private final Runnable admission;
    private final RenderingPersistenceUseCase persistence;
    private final LifecycleCleanupPersistenceUseCase cleanup;
    private final Clock clock;
    private final Launcher launcher;

    StorageBackedRenderingTaskProcess(GatewayProperties properties, NativeRenderChildSettings codec, Runnable admission,
                                     RenderingPersistenceUseCase persistence, LifecycleCleanupPersistenceUseCase cleanup, Clock clock) {
        this(properties, codec, admission, persistence, cleanup, clock, (directory, heap) -> {
            var builder = RenderJvmLauncher.builder(directory, heap, RenderingTaskChildMain.class.getName(),
                new BoundedNativeRenderChildSettings(codec, NativeProcessLimits.initial()));
            return builder.redirectOutput(ProcessBuilder.Redirect.PIPE).start();
        });
    }
    StorageBackedRenderingTaskProcess(GatewayProperties properties, NativeRenderChildSettings codec, Runnable admission,
                                     RenderingPersistenceUseCase persistence, LifecycleCleanupPersistenceUseCase cleanup,
                                     Clock clock, Launcher launcher) {
        this.properties = properties; this.codec = codec; this.admission = admission;
        this.persistence = persistence; this.cleanup = cleanup; this.clock = clock; this.launcher = launcher;
    }
    @Override public void execute(RenderingJobRepository.WorkItem job) {
        var absolute = job.createdAt().plusSeconds(3600);
        var embedded = OriginalObjectKey.expiry(job.originalObjectKey()).orElse(absolute);
        if (embedded.isBefore(absolute)) absolute = embedded;
        var remaining = Duration.between(Instant.now(clock), absolute);
        var configured = properties.getRendering().getProcessDeadline();
        if (remaining.compareTo(configured) > 0) remaining = configured;
        if (remaining.isNegative() || remaining.isZero()) {
            persistence.failUnclaimed(job.id(), GatewayErrorCode.INTERNAL_ERROR, Instant.now(clock)); return;
        }
        final var deadline = absolute;
        var process = new AtomicReference<Process>();
        var state = new State();
        state.until = System.nanoTime() + remaining.toNanos();
        try {
            IsolatedRenderAdapter.CALLS.execute(remaining, started -> owned(job, deadline, process, state), ignored -> { }, () -> {
                var active = process.get();
                if (active != null) active.destroyForcibly();
            });
        } catch (RuntimeException failure) {
            // BUSY has not acquired or failed this job. No competing invocation may mutate its state.
            if (failure instanceof RenderFileException render && render.failure() == RenderFileException.Failure.BUSY) throw failure;
            // SQL uncertainty preserves accepted artifacts; recovery is by the existing durable queues.
            try {
                var current = persistence.find(job.jobRef());
                if (current != null && current.status() == JobStatus.RENDERING) {
                    if (state.claimed) persistence.fail(job.id(), GatewayErrorCode.INTERNAL_ERROR, Instant.now(clock));
                    else persistence.failUnclaimed(job.id(), GatewayErrorCode.INTERNAL_ERROR, Instant.now(clock));
                }
            } catch (RuntimeException uncertain) { /* Reconciliation retains authority; no direct storage fallback. */ }
            throw failure;
        }
    }
    private Boolean owned(RenderingJobRepository.WorkItem job, Instant deadline, AtomicReference<Process> reference, State state) {
        Path directory = null;
        Process child = null;
        var descendants = new LinkedHashSet<ProcessHandle>();
        try {
            admission.run();
            directory = RenderingSessionDirectory.create(properties.getRendering().getTemporaryDirectory());
            child = launcher.start(directory, properties.getRendering().getChildHeapMiB());
            reference.set(child);
            if (Thread.currentThread().isInterrupted()) throw new IOException("session-abandoned");
            var storage = properties.getStorage(); var media = properties.getMedia();
            RenderingSessionProtocol.write(child.getOutputStream(), new RenderingSessionProtocol.Start(job, storage.getMode(),
                storage.getLocalDirectory() == null ? null : storage.getLocalDirectory().toString(), storage.getBucket(), codec,
                media.getMaxBytes(), media.getMaxWidthPx(), media.getMaxHeightPx(), media.getMaxPixels(), deadline));
            for (int messages = 0; messages < 128; messages++) {
                var request = RenderingSessionProtocol.read(child.getInputStream(), RenderingSessionProtocol.Request.class);
                if (Thread.currentThread().isInterrupted() || !Instant.now(clock).isBefore(deadline) || System.nanoTime() - state.until >= 0) throw new IOException("session-abandoned");
                descendants.addAll(child.descendants().toList());
                var reply = dispatch(job, request, state);
                RenderingSessionProtocol.write(child.getOutputStream(), reply);
                if ("DONE".equals(request.operation())) {
                    if (!child.waitFor(1, TimeUnit.SECONDS) || child.exitValue() != 0)
                        throw new IOException("session-exit");
                    return Boolean.TRUE;
                }
            }
            throw new IOException("session-message-limit");
        } catch (InterruptedException error) { Thread.currentThread().interrupt(); throw new RenderFileException(UNAVAILABLE); }
        catch (IOException | RuntimeException error) { throw new RenderFileException(UNAVAILABLE); }
        finally {
            try {
                if (child != null) IsolatedRenderAdapter.stop(child, descendants);
                IsolatedRenderAdapter.deleteDirectory(directory);
            } catch (IOException | RuntimeException failed) { throw new RenderFileException(CLEANUP_FAILED); }
        }
    }
    private RenderingSessionProtocol.Reply dispatch(RenderingJobRepository.WorkItem job, RenderingSessionProtocol.Request request, State state) {
        var now = Instant.now(clock);
        return switch (request.operation()) {
            case "FIND" -> new RenderingSessionProtocol.Reply(persistence.find(job.jobRef()), null, true, null);
            case "AVAILABLE" -> reply(persistence.originalAvailable(job.id(), now));
            case "CLAIM" -> {
                if (state.claimed) throw new RenderFileException(UNAVAILABLE);
                var claim = persistence.claim(job.jobRef(), now);
                state.claimed = claim == RenderingJobRepository.Claim.STARTED;
                yield new RenderingSessionProtocol.Reply(null, claim, true, null);
            }
            case "REGISTER" -> {
                var expiry = ResultObjectKey.expiry(request.key()).orElseThrow(() -> new RenderFileException(UNAVAILABLE));
                if (!expiry.isAfter(now) || expiry.isAfter(now.plusSeconds(job.resultRetentionSeconds()))
                    || state.uploads.size() >= 2 || !state.claimed || !state.uploads.add(request.key()))
                    throw new RenderFileException(UNAVAILABLE);
                yield reply(true);
            }
            case "COMPLETE" -> {
                if (!state.claimed || request.artifacts() == null
                    || !state.uploads.contains(request.artifacts().imageObjectKey())
                    || !state.uploads.contains(request.artifacts().manifestObjectKey())) throw new RenderFileException(UNAVAILABLE);
                yield reply(persistence.complete(job.id(), request.artifacts(), now));
            }
            case "FAIL" -> { persistence.fail(job.id(), GatewayErrorCode.INTERNAL_ERROR, now); yield reply(true); }
            case "FAIL_UNCLAIMED" -> { persistence.failUnclaimed(job.id(), GatewayErrorCode.INTERNAL_ERROR, now); yield reply(true); }
            case "CLEANUP_CLAIM" -> {
                state.cleanup = cleanup.claimForJob(job.id(), now, now.plusSeconds(300));
                yield new RenderingSessionProtocol.Reply(null, null, true, state.cleanup);
            }
            case "CLEANUP_COMPLETE" -> {
                requireLease(state, request);
                yield reply(cleanup.complete(job.id(), request.lease(), now));
            }
            case "CLEANUP_RESCHEDULE" -> {
                requireLease(state, request); cleanup.reschedule(job.id(), request.lease(), now.plusSeconds(60)); yield reply(true);
            }
            case "DONE" -> reply(true);
            default -> throw new RenderFileException(UNAVAILABLE);
        };
    }
    private void requireLease(State state, RenderingSessionProtocol.Request request) {
        if (state.cleanup == null || !state.cleanup.leaseUntil().equals(request.lease())) throw new RenderFileException(UNAVAILABLE);
    }
    private static RenderingSessionProtocol.Reply reply(boolean value) { return new RenderingSessionProtocol.Reply(null, null, value, null); }
    private static final class State { volatile boolean claimed; long until; final Set<String> uploads = new HashSet<>(); LifecycleCleanupRepository.CleanupClaim cleanup; }
    @FunctionalInterface interface Launcher { Process start(Path directory, int heapMiB) throws IOException; }
}
