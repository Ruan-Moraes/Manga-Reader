package com.toonlira.translationgateway.infrastructure.ocr;

import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.domain.OcrManifest;
import java.util.List;

public class DisabledOcrAdapter implements OcrPort {
    @Override
    public boolean available() { return false; }

    @Override
    public List<OcrManifest.Region> recognize(Command command) {
        throw new IllegalStateException("OCR provider is disabled");
    }
}
