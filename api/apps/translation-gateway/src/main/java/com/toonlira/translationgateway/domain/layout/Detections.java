package com.toonlira.translationgateway.domain.layout;

import java.util.List;

/** All detector classes of one page: balloons (containers) and text boxes (semantic hints only). */
public record Detections(List<Bubble> bubbles, List<TextBox> texts) {
    public Detections {
        bubbles = List.copyOf(bubbles);
        texts = List.copyOf(texts);
    }
}
