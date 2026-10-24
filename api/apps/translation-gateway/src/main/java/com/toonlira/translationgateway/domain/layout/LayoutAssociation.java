package com.toonlira.translationgateway.domain.layout;

import java.util.List;
import java.util.UUID;

public record LayoutAssociation(UUID regionId, List<String> panelCandidates, List<String> bubbleCandidates) {
    public LayoutAssociation {
        panelCandidates = List.copyOf(panelCandidates);
        bubbleCandidates = List.copyOf(bubbleCandidates);
    }
}
