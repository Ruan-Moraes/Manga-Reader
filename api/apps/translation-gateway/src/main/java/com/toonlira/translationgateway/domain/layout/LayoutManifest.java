package com.toonlira.translationgateway.domain.layout;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/** No OCR text is copied here. All region references address the unchanged OCR manifest. */
public record LayoutManifest(String layoutVersion, String imageSha256, String ocrManifestSha256,
                             String algorithmRevision, Model model, Map<String, Number> parameters,
                             ReadingDirection direction, State state, List<Panel> panels, List<Bubble> bubbles,
                             List<LayoutAssociation> associations, List<Group> groups,
                             List<UUID> suggestedOrder, List<UUID> unassociated,
                             List<Ambiguity> ambiguities, List<BubbleDeduplicator.Suppression> suppressedBubbles) {
    public enum State { complete, partial, inconclusive }
    public record Model(String name, String revision, String sha256, String license, String runtime) { }
    public record Group(String bubbleId, List<UUID> regionIds) { }
    public record Ambiguity(String reason, List<UUID> regionIds) { }
}
