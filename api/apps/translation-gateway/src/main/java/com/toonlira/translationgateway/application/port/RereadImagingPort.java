package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.ocr.MosaicLayout;
import java.nio.file.Path;
import java.util.List;

/** Builds the re-read mosaic: every crop rendered in several variants, packed into one PNG. */
public interface RereadImagingPort {
    /** Variants rendered per crop; tile {@code crop * VARIANTS + variant} of the layout. */
    int VARIANTS = 4;

    /**
     * {@code crops} are pixel rectangles {left, top, right, bottom} of the validated page. Returns null when the
     * page cannot be decoded locally (re-reading is then skipped; OCR never fails because of it).
     */
    Mosaic build(Path validatedImage, List<int[]> crops);

    /**
     * {@code framed}: each crop is laid on a white frame {@link #framePad} wide on every side before its variants
     * are rendered, so the provider sees the lettering with space around it but no page beyond the crop.
     */
    default Mosaic build(Path validatedImage, List<int[]> crops, boolean framed) {
        if (framed) throw new UnsupportedOperationException("framed crops unavailable");
        return build(validatedImage, crops);
    }

    /** White frame around a crop: half its longer side. */
    static int framePad(int[] crop) { return Math.max(crop[2] - crop[0], crop[3] - crop[1]) / 2; }

    record Mosaic(byte[] png, MosaicLayout.Layout layout) { }
}
