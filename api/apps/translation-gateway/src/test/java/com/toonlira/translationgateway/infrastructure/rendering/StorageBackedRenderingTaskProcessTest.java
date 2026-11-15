package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import com.toonlira.translationgateway.application.RenderingPersistenceUseCase;
import com.toonlira.translationgateway.application.LifecycleCleanupPersistenceUseCase;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.RenderingJobRepository;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.OriginalObjectKey;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class StorageBackedRenderingTaskProcessTest {
    @TempDir Path temporary;
    @ParameterizedTest @ValueSource(strings = {"timeout", "cancel"})
    void reapsNoncooperativeProcessBeforeAdmittingNextPage(String reason) throws Exception {
        var properties = new GatewayProperties();
        properties.getRendering().setTemporaryDirectory(temporary);
        properties.getRendering().setProcessDeadline(Duration.ofSeconds(3));
        var persistence = mock(RenderingPersistenceUseCase.class);
        var now = Instant.now();
        var job = new RenderingJobRepository.WorkItem(UUID.randomUUID(), UUID.randomUUID(), JobStatus.RENDERING,
            OriginalObjectKey.create(now, 3600), new RenderSource("image/png", 10, 1, 1, "a".repeat(64)),
            "en", "pt-BR", now, "private/ocr", "b".repeat(64), "private/translated", "c".repeat(64), null);
        when(persistence.find(job.jobRef())).thenReturn(job);
        var process = new AtomicReference<Process>(); var staging = new AtomicReference<Path>();
        var owner = new AtomicReference<Thread>(); var success = new AtomicBoolean();
        var port = new StorageBackedRenderingTaskProcess(properties, null, () -> { }, persistence,
            mock(LifecycleCleanupPersistenceUseCase.class), Clock.systemUTC(), (directory, heap) -> {
                staging.set(directory);
                if (success.get()) Files.writeString(directory.resolve("success"), "");
                var child = RenderJvmLauncher.builder(directory, 64, RenderingSessionHangProbe.class.getName())
                    .redirectOutput(ProcessBuilder.Redirect.PIPE).start();
                process.set(child); return child;
            });
        var neighbor = Files.writeString(temporary.resolve("neighbor"), "preserved");
        try (var executor = Executors.newSingleThreadExecutor()) {
            var running = executor.submit(() -> { owner.set(Thread.currentThread()); port.execute(job); });
            try {
                await(() -> staging.get() != null && Files.exists(staging.get().resolve("blocked")));
                assertThat(process.get().isAlive()).isTrue();
                if (reason.equals("cancel")) owner.get().interrupt();
                assertThatThrownBy(() -> running.get(5, TimeUnit.SECONDS)).cause()
                    .isInstanceOf(RenderFileException.class).hasMessage("render-" + (reason.equals("cancel") ? "cancelled" : "timeout"));
                await(() -> !process.get().isAlive() && IsolatedRenderAdapter.isCallCapacityAvailable());
                assertThat(Files.exists(staging.get())).isFalse();
                verify(persistence).failUnclaimed(eq(job.id()), eq(GatewayErrorCode.INTERNAL_ERROR), any());
                success.set(true); port.execute(job);
                assertThat(process.get().isAlive()).isFalse();
                assertThat(IsolatedRenderAdapter.isCallCapacityAvailable()).isTrue();
                assertThat(Files.readString(neighbor)).isEqualTo("preserved");
            } finally {
                var child = process.get();
                if (child != null) { child.destroyForcibly(); assertThat(child.waitFor(5, TimeUnit.SECONDS)).isTrue(); }
            }
        }
    }
    private static void await(java.util.function.BooleanSupplier ready) throws Exception {
        long until = System.nanoTime() + TimeUnit.SECONDS.toNanos(5);
        while (!ready.getAsBoolean() && System.nanoTime() < until) Thread.sleep(10);
        assertThat(ready.getAsBoolean()).isTrue();
    }
}
