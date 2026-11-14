package com.toonlira.translationgateway.domain.layout;

/** Detector text box: {@code text_bubble} (text inside a balloon) or {@code text_free} (captions, sound effects). */
public record TextBox(String id, Kind kind, LayoutBox bounds, double confidence) {
    public enum Kind { text_bubble, text_free }
}
