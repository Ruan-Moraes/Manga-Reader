package com.toonlira.translationgateway.infrastructure.ocr;

import static com.toonlira.translationgateway.domain.OcrLimits.MAX_REGIONS;
import static com.toonlira.translationgateway.domain.OcrLimits.MAX_RESPONSE_BYTES;
import static com.toonlira.translationgateway.domain.OcrLimits.MAX_TEXT_PER_REGION;
import static com.toonlira.translationgateway.domain.OcrLimits.MAX_TEXT_TOTAL;

import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.BoundingPoly;
import com.google.cloud.vision.v1.Paragraph;
import com.google.cloud.vision.v1.TextAnnotation.DetectedBreak;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.OcrGeometry;
import com.toonlira.translationgateway.domain.OcrManifest;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;

public final class VisionResponseMapper {
    public List<OcrManifest.Region> map(BatchAnnotateImagesResponse batch, OcrPort.Command command) {
        if (batch == null || batch.getSerializedSize() > MAX_RESPONSE_BYTES || batch.getResponsesCount() != 1) invalid();
        var response = batch.getResponses(0);
        if (response.hasError() && response.getError().getCode() != 0) {
            throw new GatewayException(GatewayErrorCode.OCR_UNAVAILABLE, 503, false);
        }
        var annotation = response.getFullTextAnnotation();
        if (annotation.getText().length() > MAX_TEXT_TOTAL || annotation.getPagesCount() > 1) invalid();
        if (annotation.getPagesCount() == 0) {
            if (!annotation.getText().isBlank() || response.getTextAnnotationsCount() != 0) invalid();
            return List.of();
        }
        var page = annotation.getPages(0);
        if (page.getWidth() != command.widthPx() || page.getHeight() != command.heightPx()) invalid();
        var regions = new ArrayList<OcrManifest.Region>();
        var seen = new HashSet<RegionContent>();
        int paragraphCount = 0;
        int totalText = 0;
        boolean hasText = !annotation.getText().isBlank() || response.getTextAnnotationsCount() != 0;
        for (int blockIndex = 0; blockIndex < page.getBlocksCount(); blockIndex++) {
            var block = page.getBlocks(blockIndex);
            for (int paragraphIndex = 0; paragraphIndex < block.getParagraphsCount(); paragraphIndex++) {
                if (++paragraphCount > MAX_REGIONS) invalid();
                var paragraph = block.getParagraphs(paragraphIndex);
                var text = text(paragraph);
                totalText += text.length();
                if (totalText > MAX_TEXT_TOTAL) invalid();
                hasText |= !text.isBlank();
                var polygon = polygon(paragraph.getBoundingBox(), command);
                if (text.isBlank() || !OcrGeometry.valid(polygon)) continue;
                if (!seen.add(new RegionContent(text, polygon))) continue;
                // Structural position (not the text) gives stable opaque IDs within the job.
                var identity = command.jobRef() + ":vision:0:" + blockIndex + ":" + paragraphIndex;
                var id = UUID.nameUUIDFromBytes(identity.getBytes(StandardCharsets.UTF_8));
                regions.add(new OcrManifest.Region(id, regions.size(), text, polygon));
            }
        }
        if (hasText && regions.isEmpty()) invalid();
        return List.copyOf(regions);
    }

    private String text(Paragraph paragraph) {
        var text = new StringBuilder();
        for (var word : paragraph.getWordsList()) {
            var wordBreak = word.getProperty().getDetectedBreak();
            if (wordBreak.getIsPrefix() && (word.getSymbolsCount() == 0
                || !word.getSymbols(0).getProperty().hasDetectedBreak()
                || !word.getSymbols(0).getProperty().getDetectedBreak().getIsPrefix())) appendBreak(text, wordBreak);
            for (var symbol : word.getSymbolsList()) {
                var separator = symbol.getProperty().getDetectedBreak();
                if (separator.getIsPrefix()) appendBreak(text, separator);
                text.append(symbol.getText());
                if (!separator.getIsPrefix()) appendBreak(text, separator);
                if (text.length() > MAX_TEXT_PER_REGION) invalid();
            }
            if (word.getProperty().hasDetectedBreak() && !wordBreak.getIsPrefix() && (word.getSymbolsCount() == 0
                || !word.getSymbols(word.getSymbolsCount() - 1).getProperty().hasDetectedBreak())) {
                // Symbol breaks take precedence; do not duplicate the word's trailing break.
                appendBreak(text, wordBreak);
            }
            if (text.length() > MAX_TEXT_PER_REGION) invalid();
        }
        return text.toString();
    }

    private void appendBreak(StringBuilder text, DetectedBreak separator) {
        text.append(switch (separator.getType()) {
            case UNKNOWN -> "";
            case SPACE, SURE_SPACE -> " ";
            case EOL_SURE_SPACE, LINE_BREAK -> "\n";
            case HYPHEN -> "-\n";
            case UNRECOGNIZED -> throw new GatewayException(GatewayErrorCode.OCR_INVALID_RESPONSE, 422, false);
        });
    }

    private List<OcrManifest.Vertex> polygon(BoundingPoly box, OcrPort.Command command) {
        if (box.getVerticesCount() != 4 || box.getNormalizedVerticesCount() != 0) return List.of();
        return box.getVerticesList().stream().map(vertex -> new OcrManifest.Vertex(
            (double) vertex.getX() / command.widthPx(), (double) vertex.getY() / command.heightPx())).toList();
    }

    private void invalid() { throw new GatewayException(GatewayErrorCode.OCR_INVALID_RESPONSE, 422, false); }
    private record RegionContent(String text, List<OcrManifest.Vertex> polygon) { }
}
