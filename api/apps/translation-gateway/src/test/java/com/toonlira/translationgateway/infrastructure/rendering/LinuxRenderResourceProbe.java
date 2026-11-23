package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.application.port.RenderPort;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

/** Mounted as a single test class, never packaged in the gateway or wired to Spring. */
public final class LinuxRenderResourceProbe {
    private static final Path WORK = Path.of("/work");
    private static final Path EXPORT = Path.of("/export");
    private LinuxRenderResourceProbe() { }

    public static void main(String[] arguments) {
        long started = System.nanoTime();
        String outcome = "failed", failure = "render-unavailable";
        RenderSource source = null;
        try {
            if (arguments.length != 0 || !System.getProperty("os.name").equals("Linux")) throw new IllegalArgumentException();
            var input = RenderSubprocessProtocol.readRequest(Path.of("/inputs/request.bin"));
            source = input.request().source();
            if (!(input.settings() instanceof RenderChildSettings settings)) throw new IllegalArgumentException();
            var codec = new WebpProcessCodec(settings.encoder(), settings.encoderSha256(), settings.decoder(),
                settings.decoderSha256(), settings.nativeTimeout());
            var renderer = new LocalFileRenderAdapter(codec, new PageRasterPainter(new BundledRenderingFonts()), WORK);
            var output = renderer.render(input.original(), input.request());
            var target = EXPORT.resolve("render-probe.webp");
            if (Files.size(output.path()) > input.request().policy().maxOutputBytes()) throw new IllegalArgumentException();
            Files.copy(output.path(), target);
            Files.delete(output.path());
            RenderSubprocessProtocol.writeResult(EXPORT.resolve("result.bin"), new RenderPort.Output(target, output.manifest()));
            outcome = "succeeded"; failure = null;
        } catch (Throwable error) {
            // No message/cause/class name or input data from arbitrary failures is persisted or logged.
            if (error instanceof RenderFileException known) failure = known.getMessage();
        }
        try {
            RenderResourceMetrics.write(WORK, EXPORT, started, outcome, failure, source, Map.of());
        } catch (Throwable ignored) {
            // Missing metrics are a failed probe, never fabricated counters or a successful render claim.
            System.exit(2);
        }
        if (!outcome.equals("succeeded")) System.exit(1);
    }

}
