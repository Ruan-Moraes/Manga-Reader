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
                             List<Ambiguity> ambiguities, List<BubbleDeduplicator.Suppression> suppressedBubbles,
                             List<TextBox> textBoxes, List<RegionKind> regionKinds) {
    public enum State { complete, partial, inconclusive }
    /**
     * Layout 1.2: detector class of each OCR region. {@code text_bubble}/{@code text_free} come from the text box
     * covering most of the region; {@code unknown} when none covers at least half of it.
     */
    public record RegionKind(UUID regionId, String kind) { }
    public record Model(String name, String revision, String sha256, String license, String runtime) { }
    public record Group(String bubbleId, List<UUID> regionIds) { }
    public record Ambiguity(String reason, List<UUID> regionIds) { }
}
