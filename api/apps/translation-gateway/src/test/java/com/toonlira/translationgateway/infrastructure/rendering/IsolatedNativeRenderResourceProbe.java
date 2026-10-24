package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.application.port.RenderPort;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.LinkedHashMap;

/** Real supervisor + Boot child + FFM, without Spring, ADC, HTTP, DB or provider clients. */
public final class IsolatedNativeRenderResourceProbe {
    private static final Path WORK = Path.of("/work"), EXPORT = Path.of("/export");
    private IsolatedNativeRenderResourceProbe() { }

    public static void main(String[] arguments) {
        long started = System.nanoTime();
        String outcome = "failed", failure = "render-unavailable";
        RenderSource source = null;
        var details = new LinkedHashMap<String, Object>();
        details.put("codec", "isolated-native-ffm-experimental");
        try {
            if (arguments.length != 0 || !"Linux".equals(System.getProperty("os.name"))) throw new IllegalArgumentException();
            var input = RenderSubprocessProtocol.readRequest(Path.of("/inputs/request.bin"));
            source = input.request().source();
            var settings = input.settings();
            if (!(settings instanceof NativeRenderChildSettings || settings instanceof BoundedNativeRenderChildSettings))
                throw new IllegalArgumentException();
            details.put("guarded", settings instanceof BoundedNativeRenderChildSettings);
            var renderer = new IsolatedRenderAdapter(WORK, settings, Duration.ofSeconds(90), 256);
            var result = renderer.render(input.original(), input.request());
            var target = EXPORT.resolve("render-probe.webp");
            Files.copy(result.path(), target); Files.delete(result.path());
            RenderSubprocessProtocol.writeResult(EXPORT.resolve("result.bin"), new RenderPort.Output(target, result.manifest()));
            details.put("outputBytes", result.manifest().image().byteSize());
            details.put("outputSha256", result.manifest().image().sha256());
            try (var files = Files.list(WORK)) {
                if (files.anyMatch(path -> path.getFileName().toString().startsWith("render-"))) throw new IllegalStateException();
            }
            outcome = "succeeded"; failure = null;
        } catch (Throwable error) {
            if (error instanceof RenderFileException known) failure = known.getMessage();
        }
        try { RenderResourceMetrics.write(WORK, EXPORT, started, outcome, failure, source, details); }
        catch (Throwable ignored) { System.exit(2); }
        if (!outcome.equals("succeeded")) System.exit(1);
    }
}
