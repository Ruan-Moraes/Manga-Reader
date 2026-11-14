package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.layout.Detections;
import com.toonlira.translationgateway.domain.layout.LayoutFailure;
import com.toonlira.translationgateway.domain.layout.LayoutManifest;
import java.nio.file.Path;

public interface LayoutPort {
    boolean available();
    LayoutManifest analyze(Path validatedImage, OcrManifest ocr, String imageHash, String ocrHash);

    /** True when detected balloons may drive OCR paragraph grouping (mode {@code grouping}), not just be recorded. */
    default boolean groups() { return false; }

    /** Detector output alone, before any OCR manifest exists. */
    default Detections detect(Path validatedImage) { throw new LayoutFailure(LayoutFailure.Code.UNAVAILABLE); }

    /** Same as {@link #analyze(Path, OcrManifest, String, String)}, reusing detections instead of a second inference. */
    default LayoutManifest analyze(Path validatedImage, OcrManifest ocr, String imageHash, String ocrHash, Detections detections) {
        return analyze(validatedImage, ocr, imageHash, ocrHash);
    }
}
