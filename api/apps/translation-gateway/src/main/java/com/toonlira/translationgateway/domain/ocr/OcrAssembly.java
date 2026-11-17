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

    /** Lettering repairs, then words the OCR ran together are cut where the page shows the name standing alone. */
    public static List<OcrManifest.Region> finish(List<OcrManifest.Region> regions, String sourceLanguage, Lexicon lexicon) {
        return GluedWords.split(LetteringRepair.repair(regions, sourceLanguage, lexicon), lexicon);
    }
}
