package com.toonlira.translationgateway.infrastructure.rendering;

import java.awt.image.BufferedImage;

/** Reconstructs artwork under a rectangle of the working raster, in place. */
public interface Inpainter {
    /** {@code box} = {left, top, right, bottom} in pixels. Returns false (raster untouched) when it cannot. */
    boolean inpaint(BufferedImage image, int[] box);
}
