package com.toonlira.translationgateway.domain.ocr;

import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.OcrParagraph;
import com.toonlira.translationgateway.domain.OcrRegionGrouper;
import com.toonlira.translationgateway.domain.layout.LayoutBox;
import java.util.List;

/**
 * The deterministic part of the OCR stage, shared by the worker and the offline corpus replay: provider paragraphs
 * become speech regions ({@link #group}), and the grouped regions get their lettering repairs ({@link #finish}).
 * Paid re-reading sits between the two steps in the worker and is not part of this class.
 */
public final class OcrAssembly {
    private OcrAssembly() { }

    /** Drops guesses, splits paragraphs that cross balloon borders (when balloons are known) and groups speeches. */
    public static List<OcrManifest.Region> group(List<OcrParagraph> read, List<LayoutBox> bubbles, String sourceLanguage,
                                                 int widthPx, int heightPx) {
        var kept = OcrParagraph.withoutGuesses(read);
        var paragraphs = bubbles == null ? kept.stream().map(OcrParagraph::region).toList()
            : OcrRegionGrouper.splitByBubbles(kept, bubbles);
        return OcrRegionGrouper.group(paragraphs, sourceLanguage, widthPx, heightPx, bubbles);
    }

    /**
     * A balloon's text box (detector {@code text_bubble}) holding exactly one region, and no part of another, is that
     * speech's whole lettering: the region takes the box. The OCR often leaves out a short column or a vertical "!"
     * beside what it read ("くれて" after "ネットワークも自動でつないで"); outside the region they were never erased and
     * stayed beside the translation, which was also confined to the read columns. Tilted regions keep their own shape.
     */
    public static List<OcrManifest.Region> fitTextBoxes(List<OcrManifest.Region> regions,
                                                        List<com.toonlira.translationgateway.domain.layout.TextBox> texts) {
        if (texts == null || texts.isEmpty() || regions.isEmpty()) return regions;
        var result = new java.util.ArrayList<>(regions);
        for (var text : texts) {
            if (text.kind() != com.toonlira.translationgateway.domain.layout.TextBox.Kind.text_bubble) continue;
            var box = text.bounds();
            int only = -1;
            boolean shared = false;
            for (int i = 0; i < result.size(); i++) {
                var bounds = bounds(result.get(i).polygon());
                double width = Math.max(0, Math.min(box.right(), bounds[2]) - Math.max(box.left(), bounds[0]));
                double height = Math.max(0, Math.min(box.bottom(), bounds[3]) - Math.max(box.top(), bounds[1]));
                double area = (bounds[2] - bounds[0]) * (bounds[3] - bounds[1]);
                if (area <= 0 || width * height <= 0) continue;
                double cx = (bounds[0] + bounds[2]) / 2, cy = (bounds[1] + bounds[3]) / 2;
                boolean centred = cx >= box.left() && cx <= box.right() && cy >= box.top() && cy <= box.bottom();
                if (centred && only < 0) only = i;
                else if (centred || width * height >= OTHER_TEXT_SHARE * area) shared = true;
            }
            if (only < 0 || shared) continue;
            var region = result.get(only);
            if (!upright(region.polygon())) continue;
            var bounds = bounds(region.polygon());
            double left = Math.min(bounds[0], box.left()), top = Math.min(bounds[1], box.top());
            double right = Math.max(bounds[2], box.right()), bottom = Math.max(bounds[3], box.bottom());
            var polygon = List.of(new OcrManifest.Vertex(left, top), new OcrManifest.Vertex(right, top),
                new OcrManifest.Vertex(right, bottom), new OcrManifest.Vertex(left, bottom));
            result.set(only, new OcrManifest.Region(region.id(), region.readingOrder(), region.sourceText(), polygon));
        }
        return List.copyOf(result);
    }

    /** Share of a region's box inside a text box from which that text box is not one region's alone. */
    static final double OTHER_TEXT_SHARE = .2;

    private static double[] bounds(List<OcrManifest.Vertex> polygon) {
        double l = 1, t = 1, r = 0, b = 0;
        for (var v : polygon) { l = Math.min(l, v.x()); r = Math.max(r, v.x()); t = Math.min(t, v.y()); b = Math.max(b, v.y()); }
        return new double[]{l, t, r, b};
    }

    /** Four vertices on an axis-aligned rectangle (what grouping and word boxes produce for upright text). */
    private static boolean upright(List<OcrManifest.Vertex> polygon) {
        if (polygon.size() != 4) return false;
        var b = bounds(polygon);
        double tolerance = 1e-6;
        for (var v : polygon) {
            boolean xEdge = Math.abs(v.x() - b[0]) < tolerance || Math.abs(v.x() - b[2]) < tolerance;
            boolean yEdge = Math.abs(v.y() - b[1]) < tolerance || Math.abs(v.y() - b[3]) < tolerance;
            if (!xEdge || !yEdge) return false;
        }
        return true;
    }

    /** Lettering repairs, then words the OCR ran together are cut where the page shows the name standing alone. */
    public static List<OcrManifest.Region> finish(List<OcrManifest.Region> regions, String sourceLanguage, Lexicon lexicon) {
        return GluedWords.split(LetteringRepair.repair(regions, sourceLanguage, lexicon), lexicon);
    }
}
