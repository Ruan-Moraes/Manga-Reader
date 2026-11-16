package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;

/**
 * Reads a validated page for analysis (balloon detection, OCR re-reading). PNG and JPEG through the JDK; WebP, which
 * the JDK cannot read, through the same pinned out-of-process decoder the renderer uses (untrusted WebP is never
 * parsed in process). Without that decoder a WebP page reads as null and callers fall back as before.
 */
public final class PageRasterReader {
    private static final RenderPolicy POLICY = RenderPolicy.initial();
    private final WebpProcessCodec webp;

    /** {@code webp}: null when no decoder is configured. */
    public PageRasterReader(WebpProcessCodec webp) { this.webp = webp; }

    public static PageRasterReader jdkOnly() { return new PageRasterReader(null); }

    /** The page, or null when it cannot be read. */
    public BufferedImage read(Path page) {
        try {
            if (isWebp(page)) return webp == null ? null : webp.decode(page, POLICY);
            return ImageIO.read(page.toFile());
        } catch (IOException | RuntimeException unreadable) {
            return null;
        }
    }

    static boolean isWebp(Path page) throws IOException {
        try (InputStream input = Files.newInputStream(page)) {
            byte[] header = input.readNBytes(12);
            return header.length == 12 && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
        }
    }
}
