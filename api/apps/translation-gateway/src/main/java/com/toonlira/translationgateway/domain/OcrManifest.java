package com.toonlira.translationgateway.domain;

import java.util.List;
import java.util.UUID;

public record OcrManifest(String version, UUID jobRef, String sourceLanguage, int widthPx, int heightPx,
                          List<Region> regions) {
    public record Region(UUID id, int readingOrder, String sourceText, List<Vertex> polygon) { }
    public record Vertex(double x, double y) { }
}
