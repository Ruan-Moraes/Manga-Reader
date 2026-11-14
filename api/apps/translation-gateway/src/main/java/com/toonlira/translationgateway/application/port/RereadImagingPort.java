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

    record Mosaic(byte[] png, MosaicLayout.Layout layout) { }
}
