package com.toonlira.translationgateway.infrastructure.rendering;

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
import java.util.LinkedHashMap;
import java.io.DataOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.concurrent.TimeUnit;

/** Synthetic fixture input is mounted read-only; exports contain operational test receipts only. */
public final class VolatileNativeProbe {
    private VolatileNativeProbe() { }
    public static void main(String[] arguments) {
        long started = System.nanoTime();
        var details = new LinkedHashMap<String, Object>();
        var work = Path.of("/work/tmp");
        String outcome = "failed", phase = "preparation";
        byte[] original = null;
        com.toonlira.translationgateway.domain.rendering.RenderSource measuredSource = null;
        try {
            if (arguments.length != 2 || !arguments[0].startsWith("volatile-")) throw new IllegalArgumentException();
            Files.createDirectories(work);
            var policy = RenderPolicy.initial();
            VolatileProcessAdmission.require();
            original = "1".equals(System.getenv("VOLATILE_ORIGINAL_STDIN"))
                ? readClientOriginal(System.in) : Files.readAllBytes(Path.of("/original"));
            var source = InMemoryMedia.inspect(original, policy);
            measuredSource = source;
            var codec = NativeCodecDistribution.admitForRuntime(Path.of("/relocated/lib"), arguments[1], Duration.ofSeconds(60));
            var limits = NativeProcessLimits.initial();
            var admission = NativeWorkerParentPreparation.prepare(work, limits);
            var renderer = new IsolatedMemoryRenderAdapter(work, new BoundedNativeRenderChildSettings(codec, limits),
                Duration.ofSeconds(90), admission::requireAvailable);
            int completed = 0;
            phase = "render";
            var languages = arguments[0].endsWith("runtime-private-delivery") ? List.of("pt-BR", "en", "es", "ja", "ko", "zh-Hans", "zh-Hant") : List.of("ja");
            for (int iteration = 0; iteration <= languages.size(); iteration++) {
                var job = UUID.randomUUID(); var target = languages.get(Math.max(0, iteration - 1));
                var pair = new LanguagePair(target.equals("en") ? "ja" : "en", target);
                var regions = iteration == 0 ? List.<OcrManifest.Region>of() : List.of(new OcrManifest.Region(UUID.randomUUID(), 0,
                    "Source", List.of(new OcrManifest.Vertex(.1,.1),new OcrManifest.Vertex(.9,.1),new OcrManifest.Vertex(.9,.4),new OcrManifest.Vertex(.1,.4))));
                var ocr = new OcrManifest("1.0", job, pair.source(), source.widthPx(), source.heightPx(), regions);
                var translationRequest = new TranslationRequest(job, pair, regions.stream().map(region ->
                    new TranslationRequest.Region(region.id(),region.readingOrder(),region.sourceText())).toList());
                var translated = new TranslationValidator(Set.of(pair)).validateResponse(translationRequest, new TranslationResponse(regions.stream()
                    .map(region -> new TranslationResponse.Region(region.id(), text(target))).toList()));
                var request = RenderRequest.create(source, ocr, translated, "a".repeat(64), "b".repeat(64), policy);
                try (var output = renderer.render(original, request)) {
                    if (!output.manifest().jobRef().equals(job) || output.manifest().regions().size() != regions.size()
                        || !output.manifest().image().sha256().equals(InMemoryMedia.sha256(output.image()))) throw new IllegalStateException();
                    var inspected = InMemoryMedia.inspectOutput(output.image(), policy);
                    if (inspected.widthPx() != source.widthPx() || inspected.heightPx() != source.heightPx()) throw new IllegalStateException();
                    boolean expectPaint = languages.size() == 7 && iteration > 0;
                    if (expectPaint && output.manifest().regions().stream().anyMatch(region -> region.overflow() || region.fontSizePx() < policy.minimumFontPx()))
                        throw new IllegalStateException();
                    phase = "pixel-comparison";
                    comparePixels(original, output.image(), request, new BoundedNativeRenderChildSettings(codec, limits), work, expectPaint);
                    phase = "render";
                }
                if (!source.sha256().equals(InMemoryMedia.sha256(original))) throw new IllegalStateException();
                completed++;
            }
            phase = "temporary-files";
            try (var files = Files.walk(work)) {
                if (files.anyMatch(Files::isRegularFile)) throw new IllegalStateException();
            }
            details.put("completedJobs", completed); details.put("contentFiles", 0); details.put("childHeapMiB", 256);
            outcome = "passed";
        } catch (Throwable error) { details.put("failedPhase", phase); }
        finally {
            if (original != null) Arrays.fill(original, (byte) 0);
            try { RenderResourceMetrics.write(work, Path.of("/export"), started, outcome,
                "passed".equals(outcome) ? null : "volatile-probe-failed", measuredSource, details); }
            catch (Exception error) { System.exit(2); }
        }
        if (!"passed".equals(outcome)) System.exit(1);
    }

    static byte[] readClientOriginal(InputStream input) throws IOException {
        byte[] bytes = input.readNBytes(Math.toIntExact(RenderPolicy.MAX_ORIGINAL_BYTES) + 1);
        if (bytes.length == 0 || bytes.length > RenderPolicy.MAX_ORIGINAL_BYTES) {
            Arrays.fill(bytes, (byte) 0);
            throw new IOException("synthetic-client-fixture-size-invalid");
        }
        return bytes;
    }

    private static String text(String language) {
        return switch (language) {
            case "pt-BR" -> "Tradução"; case "en" -> "Translation"; case "es" -> "Traducción";
            case "ja" -> "翻訳"; case "ko" -> "번역"; case "zh-Hans" -> "简体中文"; case "zh-Hant" -> "繁體中文";
            default -> throw new IllegalArgumentException();
        };
    }
    private static void comparePixels(byte[] original, byte[] rendered, RenderRequest request,
                                      BoundedNativeRenderChildSettings settings, Path work, boolean expectPaint) throws Exception {
        var builder = new ProcessBuilder(Path.of(System.getProperty("java.home"), "bin", "java").toString(),
            "--enable-native-access=ALL-UNNAMED", "-Xmx256m", "-Xms16m", "-XX:ActiveProcessorCount=1", "-XX:+UseSerialGC",
            "-XX:MaxMetaspaceSize=96m", "-XX:CompressedClassSpaceSize=32m", "-XX:ReservedCodeCacheSize=64m", "-XX:MaxDirectMemorySize=384m",
            "-XX:+ExitOnOutOfMemoryError", "-XX:-HeapDumpOnOutOfMemoryError", "-XX:-CreateCoredumpOnCrash", "-XX:ErrorFile=/dev/null",
            "-Djava.awt.headless=true", "-Djava.io.tmpdir=" + work,
            "-Dloader.main=" + VolatilePixelComparator.class.getName(), "-Dloader.home=/work",
            "-Dloader.path=/probe,BOOT-INF/classes/,BOOT-INF/lib/", "-Dloader.config.location=classpath:/META-INF/render-child-no-config.properties",
            "-cp", "/app/gateway.jar", "org.springframework.boot.loader.launch.PropertiesLauncher").redirectError(ProcessBuilder.Redirect.DISCARD);
        builder.environment().clear(); builder.environment().putAll(NativeCodecPlatform.runtime().childEnvironment());
        var child = builder.start();
        try {
            try (var output = new DataOutputStream(child.getOutputStream())) {
                VolatileRenderProtocol.writeRequest(output, original, request, settings);
                output.writeInt(rendered.length); output.write(rendered); output.writeBoolean(expectPaint);
            }
            if (!child.waitFor(90, TimeUnit.SECONDS) || child.exitValue() != 0 || child.getInputStream().read() != 1) throw new IllegalStateException();
        } finally { OwnedRenderProcess.stop(child, new java.util.LinkedHashSet<>()); }
    }
}
