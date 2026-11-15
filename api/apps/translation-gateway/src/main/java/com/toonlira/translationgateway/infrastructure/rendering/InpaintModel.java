package com.toonlira.translationgateway.infrastructure.rendering;

/**
 * The model half of inpainting: a fixed-size numeric window in, a fixed-size window out. It never sees an encoded
 * image, so the isolated renderer can run it in the parent process on windows its sandboxed child prepared.
 */
public interface InpaintModel {
    /**
     * {@code rgb} ({@link InpaintWindow#RGB_BYTES}, planar) and {@code mask} ({@link InpaintWindow#MASK_BYTES}, 0/1)
     * in; the rebuilt window ({@link InpaintWindow#RGB_BYTES}, planar) out, or null when the model cannot.
     */
    byte[] run(byte[] rgb, byte[] mask);
}
