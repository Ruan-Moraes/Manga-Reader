package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.layout.LayoutManifest;
import java.nio.file.Path;

public interface LayoutPort {
    boolean available();
    LayoutManifest analyze(Path validatedImage, OcrManifest ocr, String imageHash, String ocrHash);
}
