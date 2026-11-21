package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.OcrParagraph;
import java.util.List;
import java.util.UUID;

/** OCR of in-memory images only: the page and, for the re-read, a mosaic of crops. Nothing is stored. */
public interface InlineOcrPort {
    List<OcrManifest.Region> recognize(byte[] image, String sourceLanguage, UUID operationRef, int widthPx, int heightPx);

    /** Paragraphs with word geometry; providers without words return the plain regions. */
    default List<OcrParagraph> recognizeParagraphs(byte[] image, String sourceLanguage, UUID operationRef,
                                                   int widthPx, int heightPx) {
        return recognize(image, sourceLanguage, operationRef, widthPx, heightPx).stream()
            .map(region -> new OcrParagraph(region, List.of())).toList();
    }

    /**
     * OCR of the re-read mosaic (a PNG built from crops of the page), coordinates relative to it. Providers that
     * cannot do it throw, and re-reading is skipped.
     */
    default List<OcrParagraph> recognizeImage(byte[] png, String sourceLanguage, int widthPx, int heightPx) {
        throw new UnsupportedOperationException("Mosaic OCR unavailable");
    }
}
