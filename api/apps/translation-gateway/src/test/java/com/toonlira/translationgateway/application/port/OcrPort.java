package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.OcrManifest;
import java.util.List;
import java.util.UUID;

public interface OcrPort {
    boolean available();

    List<OcrManifest.Region> recognize(Command command);

    record Command(String objectKey, String sourceLanguage, UUID jobRef, int widthPx, int heightPx) { }
}
