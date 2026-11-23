package com.toonlira.translationgateway.application.port;

import java.awt.image.BufferedImage;

/**
 * Decodes a validated page in memory for analysis (balloon detection, OCR re-reading). Never writes it anywhere.
 * Returns null when the format is not decoded in this process (WebP is decoded only by the render child); analysis
 * is then skipped and the page is still translated.
 */
public interface PageDecoderPort {
    PageDecoderPort NONE = page -> null;

    BufferedImage decode(byte[] page);
}
