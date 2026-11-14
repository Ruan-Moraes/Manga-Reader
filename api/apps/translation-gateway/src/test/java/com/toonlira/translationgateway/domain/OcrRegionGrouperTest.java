package com.toonlira.translationgateway.domain;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class OcrRegionGrouperTest {
    private static final int W = 1000, H = 1000;

    private static OcrManifest.Region region(int order, String text, int l, int t, int r, int b) {
        return new OcrManifest.Region(new UUID(0, order + 1), order, text, List.of(
            new OcrManifest.Vertex(l / (double) W, t / (double) H), new OcrManifest.Vertex(r / (double) W, t / (double) H),
            new OcrManifest.Vertex(r / (double) W, b / (double) H), new OcrManifest.Vertex(l / (double) W, b / (double) H)));
    }

    @Test
    void mergesStackedLinesOfOneBubbleIntoOneSentence() {
        var result = OcrRegionGrouper.group(List.of(region(0, "I'M JUST ON\n", 217, 356, 430, 381),
            region(1, "MY WAY TO\n", 228, 397, 421, 423), region(2, "THE CLUB ROOM!\n", 178, 437, 473, 462)), "en", W, H);
        assertThat(result).hasSize(1);
        assertThat(result.getFirst().sourceText()).isEqualTo("I'M JUST ON MY WAY TO THE CLUB ROOM!");
        assertThat(result.getFirst().id()).isEqualTo(new UUID(0, 1));
        assertThat(OcrGeometry.valid(result.getFirst().polygon())).isTrue();
    }

    @Test
    void keepsDistantOrSideBySideRegionsApartAndReindexes() {
        var result = OcrRegionGrouper.group(List.of(region(0, "SURE!", 474, 260, 575, 285),
            region(1, "FAR", 382, 751, 634, 816), region(2, "BESIDE", 700, 751, 900, 816)), "en", W, H);
        assertThat(result).extracting(OcrManifest.Region::readingOrder).containsExactly(0, 1, 2);
        assertThat(result).extracting(OcrManifest.Region::sourceText).containsExactly("SURE!", "FAR", "BESIDE");
    }

    @Test
    void leavesVerticalCjkSourcesUntouched() {
        var input = List.of(region(0, "あ", 100, 100, 140, 400), region(1, "い", 100, 410, 140, 700));
        assertThat(OcrRegionGrouper.group(input, "ja", W, H)).isSameAs(input);
    }

    private static com.toonlira.translationgateway.domain.layout.LayoutBox box(int l, int t, int r, int b) {
        return new com.toonlira.translationgateway.domain.layout.LayoutBox(l / (double) W, t / (double) H, r / (double) W, b / (double) H);
    }

    @Test
    void balloonsKeepAnAdjacentSoundEffectOutOfTheSpeech() {
        // The proximity heuristic alone would merge all three: tight, stacked and overlapping.
        var speech1 = region(0, "YOU LINUX FREAKS\n", 100, 100, 300, 130);
        var speech2 = region(1, "ARE SO ANNOYING!\n", 100, 140, 300, 170);
        var effect = region(2, "clatter", 150, 180, 290, 210);
        assertThat(OcrRegionGrouper.group(List.of(speech1, speech2, effect), "en", W, H)).hasSize(1);
        var result = OcrRegionGrouper.group(List.of(speech1, speech2, effect), "en", W, H, List.of(box(80, 80, 320, 175)));
        assertThat(result).extracting(OcrManifest.Region::sourceText).containsExactly("YOU LINUX FREAKS ARE SO ANNOYING!", "clatter");
        assertThat(result).extracting(OcrManifest.Region::readingOrder).containsExactly(0, 1);
    }

    @Test
    void balloonJoinsItsParagraphsEvenWhenTheProviderInterleavesOthers() {
        var top = region(0, "WAIT,", 100, 100, 200, 130);
        var other = region(1, "ELSEWHERE", 600, 100, 800, 130);
        var bottom = region(2, "PLEASE!", 100, 200, 200, 230); // gap too large for the heuristic
        var result = OcrRegionGrouper.group(List.of(top, other, bottom), "en", W, H,
            List.of(box(80, 80, 230, 250), box(580, 80, 820, 150)));
        assertThat(result).extracting(OcrManifest.Region::sourceText).containsExactly("WAIT, PLEASE!", "ELSEWHERE");
        assertThat(result.getFirst().id()).isEqualTo(new UUID(0, 1));
    }

    @Test
    void differentOrOverlappingBalloonsNeverMergeAndNullFallsBackToTheHeuristic() {
        var a = region(0, "ONE\n", 100, 100, 300, 130);
        var b = region(1, "TWO\n", 100, 140, 300, 170);
        assertThat(OcrRegionGrouper.group(List.of(a, b), "en", W, H,
            List.of(box(90, 90, 310, 135), box(90, 136, 310, 180)))).hasSize(2);
        // Both inside two near-identical balloons: ambiguous, treated as free text, so the heuristic merges them.
        assertThat(OcrRegionGrouper.group(List.of(a, b), "en", W, H,
            List.of(box(90, 90, 310, 180), box(89, 89, 311, 181)))).hasSize(1);
        assertThat(OcrRegionGrouper.group(List.of(a, b), "en", W, H, null)).hasSize(1);
    }

    private static OcrParagraph.Word word(String text, int l, int t, int r, int b) {
        return new OcrParagraph.Word(text, region(0, text, l, t, r, b).polygon());
    }

    @Test
    void paragraphCrossingTheBalloonBorderIsSplitThenRegroupedWithItsSpeech() {
        var balloon = box(80, 80, 320, 200);
        var mixed = new OcrParagraph(region(0, "YOU LINUX clatter", 100, 100, 420, 130), List.of(
            word("YOU ", 100, 100, 150, 130), word("LINUX ", 160, 100, 280, 130), word("clatter", 340, 100, 420, 130)));
        var rest = new OcrParagraph(region(1, "FREAKS ARE SO ANNOYING!", 100, 140, 300, 170), List.of());
        var split = OcrRegionGrouper.splitByBubbles(List.of(mixed, rest), List.of(balloon));
        assertThat(split).extracting(OcrManifest.Region::sourceText).containsExactly("YOU LINUX", "clatter", "FREAKS ARE SO ANNOYING!");
        assertThat(split.get(0).id()).isNotEqualTo(split.get(1).id()).isNotEqualTo(mixed.region().id());
        var grouped = OcrRegionGrouper.group(split, "en", W, H, List.of(balloon));
        assertThat(grouped).extracting(OcrManifest.Region::sourceText)
            .containsExactly("YOU LINUX FREAKS ARE SO ANNOYING!", "clatter");
        // Without balloons, or when all words agree, the provider paragraph is untouched.
        // A word mostly inside the loose balloon rectangle stays with its speech.
        var border = new OcrParagraph(region(2, "WINDOWS after PATHETIC!", 100, 100, 330, 130), List.of(
            word("WINDOWS ", 100, 100, 200, 130), word("after ", 210, 100, 330, 130), word("PATHETIC!", 100, 100, 200, 130)));
        assertThat(OcrRegionGrouper.splitByBubbles(List.of(border), List.of(balloon))).containsExactly(border.region());
        // A word inside two overlapping balloon boxes is ambiguous: it follows its neighbours, never splits.
        var overlap = new OcrParagraph(region(3, "WE TEAM UP TO", 100, 100, 300, 130), List.of(
            word("WE ", 100, 100, 150, 130), word("UP ", 160, 100, 200, 130), word("TO", 250, 100, 300, 130)));
        assertThat(OcrRegionGrouper.splitByBubbles(List.of(overlap), List.of(box(80, 80, 230, 200), box(150, 80, 320, 200))))
            .extracting(OcrManifest.Region::sourceText).containsExactly("WE UP", "TO");
        assertThat(OcrRegionGrouper.splitByBubbles(List.of(overlap), List.of(box(80, 80, 320, 200), box(150, 80, 210, 200))))
            .containsExactly(overlap.region());
        assertThat(OcrRegionGrouper.splitByBubbles(List.of(mixed), null)).containsExactly(mixed.region());
        assertThat(OcrRegionGrouper.splitByBubbles(List.of(mixed), List.of(box(90, 90, 430, 140)))).containsExactly(mixed.region());
    }
}
