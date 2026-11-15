package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.OcrManifest;
import java.util.List;
import java.util.UUID;

public interface InlineOcrPort {
    List<OcrManifest.Region> recognize(byte[] image, String sourceLanguage, UUID operationRef, int widthPx, int heightPx);
}
