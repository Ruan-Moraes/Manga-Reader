package com.toonlira.translationgateway.infrastructure.rendering;

import java.nio.file.Path;

/** Isolated preparation only: no Spring, provider, credential or runtime artifact change. */
public final class SyntheticResourceJpegProbe {
    private SyntheticResourceJpegProbe() { }
    public static void main(String[] arguments) {
        try {
            if (arguments.length != 2 || !"Linux".equals(System.getProperty("os.name"))) throw new IllegalStateException();
            SyntheticResourceJpeg.write(Path.of("/work/fixture.jpeg"), Integer.parseInt(arguments[0]), Integer.parseInt(arguments[1]));
        } catch (Throwable error) { System.exit(1); }
    }
}
