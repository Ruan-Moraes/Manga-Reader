package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.InMemoryMedia;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/** Private synthetic probe: interrupt the owner while its real native child is stopped. */
public final class VolatileNativeCancellationProbe {
    private static final String CHILD = "-Dloader.main=" + VolatileRenderChildMain.class.getName();
    private VolatileNativeCancellationProbe() { }

    public static void main(String[] args) throws Exception {
        if (args.length != 1) throw new IllegalArgumentException();
        byte[] original = VolatileNativeProbe.readClientOriginal(System.in);
        try {
            var work = Path.of("/work/tmp"); Files.createDirectories(work);
            System.out.println("cancel-probe-phase=process-admission");
            VolatileProcessAdmission.require();
            var policy = RenderPolicy.initial();
            var source = InMemoryMedia.inspect(original, policy);
            System.out.println("cancel-probe-phase=codec-admission");
            var codec = NativeCodecDistribution.admitForRuntime(Path.of("/relocated/lib"), args[0], Duration.ofSeconds(60));
            var limits = NativeProcessLimits.initial();
            System.out.println("cancel-probe-phase=memory-admission");
            var admission = NativeWorkerParentPreparation.prepare(work, limits);
            var renderer = new IsolatedMemoryRenderAdapter(work, new BoundedNativeRenderChildSettings(codec, limits),
                Duration.ofSeconds(90), admission::requireAvailable);
            var pair = new LanguagePair("ja", "pt-BR"); var job = UUID.randomUUID();
            var ocr = new OcrManifest("1.0", job, pair.source(), source.widthPx(), source.heightPx(), List.of());
            var request = new TranslationRequest(job, pair, List.of());
            var translated = new TranslationValidator(Set.of(pair)).validateResponse(request, new TranslationResponse(List.of()));
            var render = RenderRequest.create(source, ocr, translated, "a".repeat(64), "b".repeat(64), policy);
            var session = new SupervisedVolatileSession(Duration.ofMinutes(3));
            var delivered = new AtomicBoolean(); var interrupted = new AtomicBoolean();
            var cancellation = new CountDownLatch(1);
            var caller = Thread.ofPlatform().start(() -> {
                try {
                    session.execute(fence -> {
                        try (var output = renderer.render(original, render)) { fence.checkActive(); delivered.set(true); }
                    }, cancellation::countDown);
                } catch (GatewayException expected) { interrupted.set(Thread.currentThread().isInterrupted()); }
            });
            var end = System.nanoTime() + TimeUnit.SECONDS.toNanos(40);
            ProcessHandle child = null;
            while (child == null && System.nanoTime() < end) {
                child = ProcessHandle.current().children().filter(p -> p.info().arguments()
                    .map(a -> Arrays.asList(a).contains(CHILD)).orElse(false)).findFirst().orElse(null);
                if (child == null) Thread.sleep(20);
            }
            if (child == null) throw new IllegalStateException("native child absent");
            VolatileOwnedFaultProbe.pause(child);
            caller.interrupt(); caller.join(5000);
            if (caller.isAlive() || !interrupted.get() || !cancellation.await(5, TimeUnit.SECONDS) || delivered.get())
                throw new IllegalStateException("cancellation not observed");
            end = System.nanoTime() + TimeUnit.SECONDS.toNanos(30);
            while (child.isAlive() && System.nanoTime() < end) Thread.sleep(25);
            if (child.isAlive()) throw new IllegalStateException("owned child remains");
            // Capacity must eventually be admitted again after owned cleanup.
            end = System.nanoTime() + TimeUnit.SECONDS.toNanos(30);
            while (true) {
                try { renderer.requireAvailable(); session.execute(fence -> fence.checkActive(), () -> { }); break; }
                catch (RuntimeException busy) { if (System.nanoTime() >= end) throw busy; Thread.sleep(25); }
            }
            try (var files = Files.walk(work)) {
                if (files.anyMatch(Files::isRegularFile)) throw new IllegalStateException("temporary file remains");
            }
            System.out.println("volatile-native-cancellation-passed");
        } finally { Arrays.fill(original, (byte) 0); }
    }
}
