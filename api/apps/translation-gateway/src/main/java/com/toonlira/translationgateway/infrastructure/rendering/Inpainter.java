package com.toonlira.translationgateway.infrastructure.rendering;

import java.awt.image.BufferedImage;

/** Reconstructs artwork under a rectangle of the working raster, in place. */
public interface Inpainter {
    /** {@code box} = {left, top, right, bottom} in pixels. Returns false (raster untouched) when it cannot. */
    default boolean inpaint(BufferedImage image, int[] box) { return inpaint(image, box, null); }

    /**
     * {@code quad}: the text's own four corners in pixels (x0, y0, ... x3, y3) inside {@code box}, or null for the whole
     * box. A slanted lettering's box is mostly art; only the quad (and the lettering's outline) is rebuilt.
     */
    boolean inpaint(BufferedImage image, int[] box, double[] quad);
}
