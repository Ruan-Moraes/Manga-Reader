package com.toonlira.translationgateway.domain.ocr;

import static org.assertj.core.api.Assertions.assertThat;

import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.layout.LayoutBox;
import com.toonlira.translationgateway.domain.layout.TextBox;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class OcrAssemblyTextBoxTest {
    private static OcrManifest.Region region(String text, double l, double t, double r, double b) {
        return new OcrManifest.Region(UUID.randomUUID(), 0, text, List.of(new OcrManifest.Vertex(l, t), new OcrManifest.Vertex(r, t),
            new OcrManifest.Vertex(r, b), new OcrManifest.Vertex(l, b)));
    }

    private static TextBox box(TextBox.Kind kind, double l, double t, double r, double b) {
        return new TextBox("t", kind, new LayoutBox(l, t, r, b), .9);
    }

    @Test
    void aBalloonsTextBoxWithOneRegionGivesItTheWholeLettering() {
        // The OCR read one column of a balloon; the detector's text box also holds the column it left out.
        var read = region("ネットワーク", .85, .25, .90, .36);
        var fitted = OcrAssembly.fitTextBoxes(List.of(read), List.of(box(TextBox.Kind.text_bubble, .81, .24, .91, .37)));
        assertThat(fitted.getFirst().polygon()).containsExactly(new OcrManifest.Vertex(.81, .24), new OcrManifest.Vertex(.91, .24),
            new OcrManifest.Vertex(.91, .37), new OcrManifest.Vertex(.81, .37));
        assertThat(fitted.getFirst().sourceText()).isEqualTo("ネットワーク");
    }

    @Test
    void sharedFreeOrTiltedTextKeepsItsOwnBox() {
        var one = region("A", .10, .10, .14, .20);
        var two = region("B", .15, .10, .19, .20);
        var balloon = box(TextBox.Kind.text_bubble, .08, .08, .21, .22);
        // Two speeches in one box: neither takes it.
        assertThat(OcrAssembly.fitTextBoxes(List.of(one, two), List.of(balloon))).containsExactly(one, two);
        // Free text (captions, sound effects over the art) keeps its own box.
        assertThat(OcrAssembly.fitTextBoxes(List.of(one), List.of(box(TextBox.Kind.text_free, .08, .08, .21, .22)))).containsExactly(one);
        // A slanted line keeps its slanted shape.
        var tilted = new OcrManifest.Region(UUID.randomUUID(), 0, "C", List.of(new OcrManifest.Vertex(.10, .12),
            new OcrManifest.Vertex(.14, .10), new OcrManifest.Vertex(.16, .18), new OcrManifest.Vertex(.12, .20)));
        assertThat(OcrAssembly.fitTextBoxes(List.of(tilted), List.of(balloon))).containsExactly(tilted);
    }
}
