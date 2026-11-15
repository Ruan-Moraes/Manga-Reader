package com.toonlira.translationgateway.infrastructure.rendering;

import java.nio.file.Files;
import java.nio.file.LinkOption;
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
            // Inpainting is two-pass (InpaintExchange): record windows first, apply the parent's answers second.
            Inpainter inpainter = null;
            InpaintExchange.Recorder recorder = null;
            if (Files.exists(directory.resolve(InpaintExchange.ENABLED), LinkOption.NOFOLLOW_LINKS)) {
                var patches = directory.resolve(InpaintExchange.PATCHES);
                if (Files.exists(patches, LinkOption.NOFOLLOW_LINKS)) {
                    var windows = InpaintExchange.readWindows(directory.resolve(InpaintExchange.REQUEST));
                    inpainter = new InpaintExchange.Replayer(windows, InpaintExchange.readPatches(patches, windows.size()));
                } else inpainter = recorder = new InpaintExchange.Recorder();
            }
            var painter = new PageRasterPainter(new BundledRenderingFonts(), inpainter);
            var renderer = switch (input.settings()) {
                case RenderChildSettings cli -> new LocalFileRenderAdapter(new WebpProcessCodec(cli.encoder(),
                    cli.encoderSha256(), cli.decoder(), cli.decoderSha256(), cli.nativeTimeout()), painter, directory);
                case NativeRenderChildSettings nativeCodec -> new NativeFileRenderAdapter(nativeCodec, painter, directory);
                case BoundedNativeRenderChildSettings bounded -> new NativeFileRenderAdapter(bounded.codec(), painter, directory);
            };
            var result = renderer.render(input.original(), input.request());
            RenderSubprocessProtocol.writeResult(directory.resolve("result.bin"), result);
            if (recorder != null && !recorder.windows().isEmpty())
                InpaintExchange.writeWindows(directory.resolve(InpaintExchange.REQUEST), recorder.windows());
        } catch (Throwable error) {
            // Includes native/font/linkage/heap failures. Never serialize/log a raw throwable or partial success.
            System.exit(1);
        }
    }
}
