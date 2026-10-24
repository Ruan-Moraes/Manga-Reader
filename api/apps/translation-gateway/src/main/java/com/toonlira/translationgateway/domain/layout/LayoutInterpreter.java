package com.toonlira.translationgateway.domain.layout;

import com.toonlira.translationgateway.domain.OcrManifest;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.toonlira.translationgateway.domain.layout.LayoutParameters.*;

public final class LayoutInterpreter {
    public LayoutManifest interpret(OcrManifest ocr, String imageHash, String manifestHash,
                                    LayoutManifest.Model model, ReadingDirection direction,
                                    List<Panel> panels, List<Bubble> bubbles) {
        if (direction == null) throw new IllegalArgumentException("Reading direction required");
        var filtered = BubbleDeduplicator.filter(bubbles);
        var links = LayoutAssociator.associate(ocr.regions(), panels, filtered.retained());
        var ambiguities = new ArrayList<LayoutManifest.Ambiguity>();
        var unassociated = new ArrayList<UUID>();
        var groups = new LinkedHashMap<String, List<UUID>>();
        for (var link : links) {
            if (link.panelCandidates().isEmpty() || link.bubbleCandidates().isEmpty()) unassociated.add(link.regionId());
            if (link.panelCandidates().size() > 1 || link.bubbleCandidates().size() > 1)
                ambiguities.add(new LayoutManifest.Ambiguity("multiple-containers", List.of(link.regionId())));
            if (link.bubbleCandidates().size() == 1)
                groups.computeIfAbsent(link.bubbleCandidates().getFirst(), ignored -> new ArrayList<>()).add(link.regionId());
        }
        var order = new ArrayList<UUID>();
        for (var panel : panels) {
            var members = ocr.regions().stream().filter(region -> links.stream().anyMatch(link ->
                link.regionId().equals(region.id()) && link.panelCandidates().equals(List.of(panel.id()))
                    && link.bubbleCandidates().size() <= 1)).toList();
            // A bubble is a reading unit even when Vision split it into different blocks.
            var units = new LinkedHashMap<String, List<OcrManifest.Region>>();
            for (var region : members) {
                var link = links.stream().filter(item -> item.regionId().equals(region.id())).findFirst().orElseThrow();
                String key = link.bubbleCandidates().isEmpty() ? region.id().toString() : link.bubbleCandidates().getFirst();
                units.computeIfAbsent(key, ignored -> new ArrayList<>()).add(region);
            }
            var orderedUnits = sortUnambiguous(new ArrayList<>(units.values()), direction, ambiguities);
            for (var unit : orderedUnits) {
                var individual = unit.stream().map(List::of).toList();
                sortUnambiguous(individual, direction, ambiguities).forEach(item -> order.add(item.getFirst().id()));
            }
        }
        var state = panels.isEmpty() ? LayoutManifest.State.inconclusive
            : ambiguities.isEmpty() && unassociated.isEmpty() ? LayoutManifest.State.complete : LayoutManifest.State.partial;
        return new LayoutManifest("1.1", imageHash, manifestHash, ALGORITHM_REVISION, model,
            Map.of("whiteChannel", WHITE_CHANNEL, "clearCoverage", CLEAR_COVERAGE, "minimumGutterFraction", MIN_GUTTER_FRACTION,
                "minimumPanelArea", MIN_PANEL_AREA, "containment", CONTAINMENT, "confidence", CONFIDENCE,
                "duplicateIou", DUPLICATE_IOU),
            direction, state, List.copyOf(panels), filtered.retained(), links,
            groups.entrySet().stream().map(entry -> new LayoutManifest.Group(entry.getKey(), List.copyOf(entry.getValue()))).toList(),
            List.copyOf(order), List.copyOf(unassociated), List.copyOf(ambiguities), filtered.suppressed());
    }

    private List<List<OcrManifest.Region>> sortUnambiguous(List<List<OcrManifest.Region>> units, ReadingDirection direction,
                                                         List<LayoutManifest.Ambiguity> ambiguities) {
        var remaining = new ArrayList<>(units);
        var result = new ArrayList<List<OcrManifest.Region>>();
        while (!remaining.isEmpty()) {
            var next = remaining.stream().filter(candidate -> remaining.stream().allMatch(other ->
                other == candidate || precedes(bounds(candidate), bounds(other), direction))).toList();
            if (next.size() != 1) {
                ambiguities.add(new LayoutManifest.Ambiguity("unresolved-reading-order",
                    remaining.stream().flatMap(List::stream).map(OcrManifest.Region::id).toList()));
                break;
            }
            result.add(next.getFirst());
            remaining.remove(next.getFirst());
        }
        return result;
    }

    private LayoutBox bounds(List<OcrManifest.Region> regions) {
        var boxes = regions.stream().map(region -> LayoutGeometry.bounds(region.polygon())).toList();
        return new LayoutBox(boxes.stream().mapToDouble(LayoutBox::left).min().orElseThrow(),
            boxes.stream().mapToDouble(LayoutBox::top).min().orElseThrow(),
            boxes.stream().mapToDouble(LayoutBox::right).max().orElseThrow(),
            boxes.stream().mapToDouble(LayoutBox::bottom).max().orElseThrow());
    }

    private boolean precedes(LayoutBox a, LayoutBox b, ReadingDirection direction) {
        if (a.bottom() <= b.top()) return true;
        if (b.bottom() <= a.top()) return false;
        return direction == ReadingDirection.ltr ? a.right() <= b.left() : a.left() >= b.right();
    }
}
