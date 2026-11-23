package com.toonlira.translationgateway.domain.layout;

import com.toonlira.translationgateway.domain.OcrManifest;
import org.junit.jupiter.api.Test;
import org.assertj.core.data.Offset;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LayoutAssociationTest {
    @Test
    void clipsPolygonRatherThanItsBoundingBox() {
        var diamond = List.of(point(.5, 0), point(1, .5), point(.5, 1), point(0, .5));
        assertThat(LayoutGeometry.containment(diamond, new LayoutBox(0, 0, 1, .9)))
            .isCloseTo(.98, Offset.offset(1e-10));
    }

    @Test
    void groupsByBubbleRegardlessOfTextOrProviderBlockAndKeepsAmbiguity() {
        var first = region(.1, .1, .3, .2);
        var second = region(.1, .25, .3, .35);
        var outside = region(.85, .85, .95, .95);
        var panel = new Panel("panel-0", new LayoutBox(0, 0, 1, .8));
        var bubble = new Bubble("bubble-0", new LayoutBox(.05, .05, .5, .5), .9);
        var regions = List.of(first, second, outside);

        var links = LayoutAssociator.associate(regions, List.of(panel), List.of(bubble));

        assertThat(links).hasSize(3);
        assertThat(links.get(0).bubbleCandidates()).containsExactly("bubble-0");
        assertThat(links.get(1).bubbleCandidates()).containsExactly("bubble-0");
        assertThat(links.get(2).bubbleCandidates()).isEmpty();
        assertThat(links.get(2).panelCandidates()).isEmpty();
        var ambiguous = LayoutAssociator.associate(regions, List.of(panel),
            List.of(bubble, new Bubble("bubble-1", bubble.bounds(), .8)));
        assertThat(ambiguous.getFirst().bubbleCandidates()).containsExactly("bubble-0", "bubble-1");
        assertThat(first.sourceText()).isEqualTo(second.sourceText());
        assertThat(links).extracting(LayoutAssociation::regionId).containsExactly(first.id(), second.id(), outside.id());
    }

    @Test
    void usesNinetyPercentInclusiveThresholdAndRejectsInvalidGeometry() {
        var region = region(0, 0, 1, 1);
        assertThat(LayoutAssociator.associate(List.of(region),
            List.of(new Panel("p", new LayoutBox(0, 0, .9, 1))), List.of()).getFirst().panelCandidates())
            .containsExactly("p");
        assertThatThrownBy(() -> new LayoutBox(0, 0, Double.NaN, 1)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> LayoutGeometry.containment(List.of(), new LayoutBox(0, 0, 1, 1)))
            .isInstanceOf(LayoutFailure.class);
    }

    private OcrManifest.Region region(double left, double top, double right, double bottom) {
        return new OcrManifest.Region(UUID.randomUUID(), 0, "repeated text",
            List.of(point(left, top), point(right, top), point(right, bottom), point(left, bottom)));
    }

    private OcrManifest.Vertex point(double x, double y) { return new OcrManifest.Vertex(x, y); }
}
