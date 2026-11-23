package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.OcrParagraph;
import java.util.List;
import java.util.UUID;

public interface OcrPort {
    boolean available();

    List<OcrManifest.Region> recognize(Command command);

    /**
     * OCR of an in-memory PNG (the re-read mosaic), coordinates relative to it. Providers that cannot do it throw,
     * and re-reading is skipped.
     */
    default List<OcrParagraph> recognizeImage(byte[] png, String sourceLanguage, int widthPx, int heightPx) {
        throw new UnsupportedOperationException("In-memory OCR unavailable");
    }

    /** Paragraphs with word geometry; providers without words return the plain regions. */
    default List<OcrParagraph> recognizeParagraphs(Command command) {
        return recognize(command).stream().map(region -> new OcrParagraph(region, List.of())).toList();
    }

    record Command(String objectKey, String sourceLanguage, UUID jobRef, int widthPx, int heightPx) { }
}
