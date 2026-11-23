package com.toonlira.translationgateway.domain.layout;

import com.toonlira.translationgateway.domain.OcrManifest.Region;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;

import static com.toonlira.translationgateway.domain.layout.LayoutParameters.*;

public final class LayoutAssociator {
    private LayoutAssociator() { }

    public static List<LayoutAssociation> associate(List<Region> regions, List<Panel> panels, List<Bubble> bubbles) {
        if (regions.size() > MAX_ASSOCIATIONS || panels.size() > MAX_PANELS || bubbles.size() > MAX_BUBBLES)
            throw new LayoutFailure(LayoutFailure.Code.LIMIT_EXCEEDED);
        var ids = new HashSet<UUID>();
        for (var region : regions) {
            if (region.id() == null || !ids.add(region.id())) throw new LayoutFailure(LayoutFailure.Code.INVALID_RESPONSE);
            LayoutGeometry.bounds(region.polygon());
        }
        return regions.stream().map(region -> new LayoutAssociation(region.id(),
            panels.stream().filter(panel -> LayoutGeometry.containment(region.polygon(), panel.bounds()) >= CONTAINMENT)
                .map(Panel::id).toList(),
            bubbles.stream().filter(bubble -> LayoutGeometry.containment(region.polygon(), bubble.bounds()) >= CONTAINMENT)
                .map(Bubble::id).toList())).toList();
    }
}
