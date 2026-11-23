package com.toonlira.translationgateway.infrastructure.rendering;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.util.Arrays;

/** No Spring, provider, database, credential lookup or content files. */
public final class VolatileRenderChildMain {
    private VolatileRenderChildMain() { }
    public static void main(String[] args) {
        byte[] original = null;
        try {
            if (args.length != 0) throw new IllegalArgumentException();
            LinuxNativeProcessGuard.apply(NativeProcessLimits.initial());
            var input = new DataInputStream(System.in);
            var settings = VolatileRenderProtocol.readSettings(input);
            if (!settings.settings().limits().equals(NativeProcessLimits.initial())) throw new IllegalArgumentException();
            original = VolatileRenderProtocol.readFrame(input, (int) settings.policy().maxOriginalBytes());
            // Inpainting is two-pass: record windows first, apply the parent's answers second (InpaintExchange).
            Inpainter inpainter = null;
            InpaintExchange.Recorder recorder = null;
            switch (settings.inpaint()) {
                case RECORD -> inpainter = recorder = new InpaintExchange.Recorder();
                case REPLAY -> {
                    var windows = InpaintExchange.readWindows(input);
                    inpainter = new InpaintExchange.Replayer(windows, InpaintExchange.readPatches(input, windows.size()));
                }
                case NONE -> { }
            }
            if (input.read() != -1) throw new IllegalArgumentException();
            var renderer = new NativeMemoryRenderAdapter(settings.settings().codec(), new PageRasterPainter(new BundledRenderingFonts(), inpainter));
            try (var result = renderer.render(original, settings.request())) {
                VolatileRenderProtocol.writeResult(new DataOutputStream(System.out), result, recorder == null ? null : recorder.windows());
            }
        } catch (Throwable error) {
            // Never serialize an exception, partial success or provider content.
            System.exit(1);
        } finally { if (original != null) Arrays.fill(original, (byte) 0); }
    }
}
