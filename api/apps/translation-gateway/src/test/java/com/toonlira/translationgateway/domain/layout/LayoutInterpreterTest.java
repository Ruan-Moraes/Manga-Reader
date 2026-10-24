package com.toonlira.translationgateway.domain.layout;

import com.toonlira.translationgateway.domain.OcrManifest;
import org.junit.jupiter.api.Test;
import java.util.List;
import java.util.UUID;
import static org.assertj.core.api.Assertions.assertThat;

class LayoutInterpreterTest {
    @Test void nearDuplicateDoesNotHideTheSpeechFromSuggestedOrder() {
        var speech = region(.5, .38, .6, .41);
        var ocr = new OcrManifest("1.0", UUID.randomUUID(), "ko", 100, 200, List.of(speech));
        var winner = new Bubble("winner", new LayoutBox(.483581364, .366182864, .643148959, .429617792), .9308574);
        var duplicate = new Bubble("duplicate", new LayoutBox(.483704656, .365973175, .642633319, .429387093), .6257724);
        var layout = interpret(ocr, ReadingDirection.ltr, List.of(duplicate, winner));
        assertThat(layout.bubbles()).containsExactly(winner);
        assertThat(layout.suggestedOrder()).containsExactly(speech.id());
        assertThat(layout.ambiguities()).isEmpty();
        assertThat(layout.layoutVersion()).isEqualTo("1.1");
        assertThat(layout.suppressedBubbles()).hasSize(1);
        BubbleDeduplicator.validateAudit(layout);
        assertThat(ocr.regions()).containsExactly(speech);
    }

    @Test void distinctContainersStillRemainAmbiguousAfterFiltering() {
        var speech = region(.4, .4, .6, .6);
        var ocr = new OcrManifest("1.0", UUID.randomUUID(), "en", 100, 100, List.of(speech));
        var layout = interpret(ocr, ReadingDirection.ltr, List.of(
            new Bubble("a", new LayoutBox(.1, .1, .8, .8), .9),
            new Bubble("b", new LayoutBox(.2, .2, .9, .9), .8)));
        assertThat(layout.suppressedBubbles()).isEmpty();
        assertThat(layout.ambiguities()).extracting(LayoutManifest.Ambiguity::reason).contains("multiple-containers");
        assertThat(layout.suggestedOrder()).isEmpty();
    }

    @Test void groupsSeparateProviderParagraphsAndRetainsLegitimateRepeatedText() {
        var top = region(.1, .1, .2, .15);
        var bottom = region(.1, .2, .2, .25);
        var outside = region(.7, .1, .8, .2);
        var ocr = new OcrManifest("1.0", UUID.randomUUID(), "ja", 100, 200, List.of(bottom, outside, top));
        var layout = interpret(ocr, ReadingDirection.ltr, List.of(new Bubble("b", new LayoutBox(.05, .05, .4, .4), .9)));
        assertThat(layout.groups()).hasSize(1);
        assertThat(layout.groups().getFirst().regionIds()).containsExactly(bottom.id(), top.id());
        assertThat(layout.suggestedOrder()).containsExactly(top.id(), bottom.id(), outside.id());
        assertThat(layout.unassociated()).containsExactly(outside.id());
        assertThat(ocr.regions()).containsExactly(bottom, outside, top);
    }

    @Test void directionDoesNotComeFromLanguageAndOverlapsRemainUnresolved() {
        var left = region(.1, .1, .3, .3);
        var right = region(.7, .1, .9, .3);
        var ocr = new OcrManifest("1.0", UUID.randomUUID(), "ja", 100, 200, List.of(left, right));
        assertThat(interpret(ocr, ReadingDirection.ltr, List.of()).suggestedOrder()).containsExactly(left.id(), right.id());
        assertThat(interpret(ocr, ReadingDirection.rtl, List.of()).suggestedOrder()).containsExactly(right.id(), left.id());
        var overlap = region(.2, .2, .4, .4);
        var unresolved = interpret(new OcrManifest("1.0", UUID.randomUUID(), "en", 100, 200, List.of(left, overlap)),
            ReadingDirection.ltr, List.of());
        assertThat(unresolved.suggestedOrder()).isEmpty();
        assertThat(unresolved.ambiguities()).hasSize(1);
        assertThat(unresolved.state()).isEqualTo(LayoutManifest.State.partial);
    }

    private LayoutManifest interpret(OcrManifest ocr, ReadingDirection direction, List<Bubble> bubbles) {
        return new LayoutInterpreter().interpret(ocr, "a".repeat(64), "b".repeat(64), null, direction,
            List.of(new Panel("p", new LayoutBox(0, 0, 1, 1))), bubbles);
    }

    private OcrManifest.Region region(double l, double t, double r, double b) {
        return new OcrManifest.Region(UUID.randomUUID(), 0, "same",
            List.of(new OcrManifest.Vertex(l, t), new OcrManifest.Vertex(r, t), new OcrManifest.Vertex(r, b), new OcrManifest.Vertex(l, b)));
    }
}
