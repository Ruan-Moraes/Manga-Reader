package com.toonlira.translationgateway.infrastructure.rendering;

import java.nio.file.Path;

/** Deliberately no Spring bootstrap, provider client, DB, credential lookup or logging. */
public final class RenderChildMain {
    private RenderChildMain() { }

    public static void main(String[] args) {
        try {
            if (args.length != 0) throw new IllegalStateException();
            var directory = Path.of("").toAbsolutePath().toRealPath();
            var input = RenderSubprocessProtocol.readRequest(directory.resolve("request.bin"));
            if (input.settings() instanceof BoundedNativeRenderChildSettings bounded)
                LinuxNativeProcessGuard.apply(bounded.limits());
            var painter = new PageRasterPainter(new BundledRenderingFonts());
            var renderer = switch (input.settings()) {
                case RenderChildSettings cli -> new LocalFileRenderAdapter(new WebpProcessCodec(cli.encoder(),
                    cli.encoderSha256(), cli.decoder(), cli.decoderSha256(), cli.nativeTimeout()), painter, directory);
                case NativeRenderChildSettings nativeCodec -> new NativeFileRenderAdapter(nativeCodec, painter, directory);
                case BoundedNativeRenderChildSettings bounded -> new NativeFileRenderAdapter(bounded.codec(), painter, directory);
            };
            var result = renderer.render(input.original(), input.request());
            RenderSubprocessProtocol.writeResult(directory.resolve("result.bin"), result);
        } catch (Throwable error) {
            // Includes native/font/linkage/heap failures. Never serialize/log a raw throwable or partial success.
            System.exit(1);
        }
    }
}
