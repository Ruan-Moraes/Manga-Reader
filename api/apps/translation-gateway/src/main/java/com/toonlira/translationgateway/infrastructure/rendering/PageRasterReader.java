package com.toonlira.translationgateway.infrastructure.rendering;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import javax.imageio.ImageIO;

/**
 * Reads a validated page for analysis (balloon detection, OCR re-reading): PNG and JPEG through the JDK, in memory.
 * WebP is never parsed in the API process (only the render child decodes untrusted WebP); a WebP page reads as null
 * and callers fall back: layout grouping and re-reading are skipped for it.
 */
public final class PageRasterReader implements com.toonlira.translationgateway.application.port.PageDecoderPort {
    public PageRasterReader() { }

    public static PageRasterReader jdkOnly() { return new PageRasterReader(); }

    /** The page, or null when it cannot be read (WebP, corrupt, unknown format). */
    public BufferedImage read(byte[] page) {
        if (page == null || isWebp(page)) return null;
        try { return ImageIO.read(new ByteArrayInputStream(page)); }
        catch (IOException | RuntimeException unreadable) { return null; }
    }

    @Override
    public BufferedImage decode(byte[] page) { return read(page); }

    /** Legacy file pipeline (tests only): same rules as {@link #read(byte[])}. */
    public BufferedImage read(Path page) {
        try { return read(Files.readAllBytes(page)); }
        catch (IOException | RuntimeException unreadable) { return null; }
    }

    static boolean isWebp(byte[] header) {
        return header.length >= 12 && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
            && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
    }

    static boolean isWebp(Path page) throws IOException {
        try (InputStream input = Files.newInputStream(page)) { return isWebp(input.readNBytes(12)); }
    }
}
