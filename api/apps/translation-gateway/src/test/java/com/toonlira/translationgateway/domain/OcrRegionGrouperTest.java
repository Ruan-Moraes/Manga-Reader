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
    void wordsOfOneLineJoinWhateverTheirAscendersButStackedTitlesOfDifferentSizeDoNot() {
        // A footnote read as four paragraphs: "may" (descender) is twice as tall as "see", yet it is one line.
        var line = OcrRegionGrouper.group(List.of(region(0, "You\n", 60, 740, 87, 750), region(1, "may\n", 94, 744, 129, 757),
            region(2, "see\n", 133, 744, 159, 750), region(3, "Ubuntu referred to as Ubunchu. Please enjoy it!\n", 167, 740, 557, 754)),
            "en", W, H);
        assertThat(line).hasSize(1);
        // A big title over a small subtitle (stacked) stays apart, as before.
        var stacked = OcrRegionGrouper.group(List.of(region(0, "BIG TITLE\n", 100, 100, 700, 220),
            region(1, "a small subtitle\n", 120, 230, 680, 260)), "en", W, H);
        assertThat(stacked).hasSize(2);
    }

    @Test
    void aSoundEffectBesideASpeechLineIsNotAWordOfIt() {
        // "clatter" a few letters away from "YOU LINUX" (gap wider than a letter), and one covering the line's end.
        var away = OcrRegionGrouper.group(List.of(region(0, "YOU LINUX\n", 230, 81, 353, 121),
            region(1, "clatter\n", 371, 71, 448, 107)), "en", W, H);
        assertThat(away).hasSize(2);
        var covering = OcrRegionGrouper.group(List.of(region(0, "YOU LINUX clatter\n", 230, 72, 448, 121),
            region(1, "clatter\n", 440, 70, 502, 115)), "en", W, H);
        assertThat(covering).hasSize(2);
    }

    @Test
    void longProviderParagraphsKeepTheirBreakWhileSpeechIsJoinedBySpaces() {
        var first = region(0, "This comic is presented in its original Japanese\nright-to-left format, in order to preserve as much\nof the detail of the original artwork as possible.\n", 100, 100, 800, 220);
        var second = region(1, "But if you prefer authenticity or simply wish to\nhave fun trying something new, all you need to do\nis start from the top-right panel of each page.\n", 100, 240, 800, 360);
        assertThat(OcrRegionGrouper.paragraphBreak(first, second)).isTrue();
        assertThat(OcrRegionGrouper.paragraphBreak(null, second)).isFalse();
        // Short speech paragraphs in one balloon stay one line of thought.
        assertThat(OcrRegionGrouper.paragraphBreak(region(0, "HUH?!\n", 0, 0, 50, 20), region(1, "WHAT?\n", 0, 25, 50, 45))).isFalse();
        // A long paragraph that does not end a sentence continues in the next one.
        var unfinished = region(0, "This comic is presented in its original Japanese\nright-to-left format, in order to preserve as much\nof the detail of the original artwork and\n", 100, 100, 800, 220);
        assertThat(OcrRegionGrouper.paragraphBreak(unfinished, second)).isFalse();
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
    void verticalJapaneseColumnsOfOneSpeechAreReadRightToLeftAndJoinedWithoutSpaces() {
        // Real columns (Ubunchu! ep.1 p.04, scaled to this 1000 px fixture), provider order middle, right, left.
        var middle = region(0, "インスコしてみる\n", 846, 446, 865, 566);
        var right = region(1, "試しにちょっと\n", 877, 444, 896, 551);
        var left = region(2, "だけだかんな\n", 818, 445, 835, 536);
        var far = region(3, "イラネ\n", 80, 264, 99, 313);
        var result = OcrRegionGrouper.group(List.of(middle, right, left, far), "ja", W, H);
        assertThat(result).extracting(OcrManifest.Region::sourceText).containsExactly("試しにちょっとインスコしてみるだけだかんな", "イラネ\n"); // single paragraphs keep their text
        assertThat(result.getFirst().id()).isEqualTo(right.id()); // first column in reading order
        // A column stacked under another in the same x span stays apart unless it continues it.
        var input = List.of(region(0, "あ", 100, 100, 140, 400), region(1, "い", 100, 410, 140, 700));
        assertThat(OcrRegionGrouper.group(input, "ja", W, H)).hasSize(2);
    }

    @Test
    void horizontalCjkLinesJoinTopDownAndKoreanKeepsItsSpaces() {
        var lines = List.of(region(0, "LiveCD,\n", 59, 439, 138, 457), region(1, "てゆーらしい\n", 59, 461, 152, 480),
            region(2, "ですよ\n", 63, 483, 121, 500));
        assertThat(OcrRegionGrouper.group(lines, "ja", W, H)).extracting(OcrManifest.Region::sourceText)
            .containsExactly("LiveCD,てゆーらしいですよ");
        var korean = List.of(region(0, "우리는\n", 100, 100, 300, 130), region(1, "친구야\n", 100, 135, 300, 165));
        assertThat(OcrRegionGrouper.group(korean, "ko", W, H)).extracting(OcrManifest.Region::sourceText).containsExactly("우리는 친구야");
    }

    @Test
    void distinctBalloonsKeepNeighbouringColumnsApartButOverlappingBoxesOfOneBalloonDoNot() {
        var reply = region(0, "なによそれっ\n", 300, 100, 324, 260);
        var speech = region(1, "謳歌してろよ\n", 334, 100, 358, 280);
        assertThat(OcrRegionGrouper.group(List.of(reply, speech), "ja", W, H)).hasSize(1); // no balloons: neighbours join
        // Two separate balloons (boxes barely touch): never one speech.
        assertThat(OcrRegionGrouper.group(List.of(reply, speech), "ja", W, H, List.of(box(280, 80, 328, 290), box(329, 80, 380, 300))))
            .hasSize(2);
        // Two partial boxes of the same balloon (they overlap a lot): one speech, right column first.
        assertThat(OcrRegionGrouper.group(List.of(reply, speech), "ja", W, H, List.of(box(280, 80, 340, 290), box(290, 80, 380, 300))))
            .extracting(OcrManifest.Region::sourceText).containsExactly("謳歌してろよなによそれっ");
    }

    @Test
    void piecesClearlyInsideOneBalloonAreOneSpeechEvenWhenFarApart() {
        // Real geometry (Ubunchu! ep.1 p.09, scaled 0.6): a column broken by a pause and a column widened by Latin.
        var pause = region(0, "こっ\n", 206, 809, 217, 837);
        var rest = region(1, "この\n", 204, 857, 216, 887);
        var latin = region(2, "CCSMってコンパネ", 155, 808, 191, 904);
        var other = region(3, "アヤしくないですか?", 73, 819, 110, 914);
        var balloons = List.of(box(140, 790, 232, 916), box(60, 800, 125, 925));
        assertThat(OcrRegionGrouper.group(List.of(pause, rest, latin, other), "ja", W, H, balloons))
            .extracting(OcrManifest.Region::sourceText).containsExactly("こっこのCCSMってコンパネ", "アヤしくないですか?");
        // Without balloons nothing proves they belong together.
        assertThat(OcrRegionGrouper.group(List.of(pause, rest, latin), "ja", W, H)).hasSizeGreaterThan(1);
    }

    @Test
    void aBigHandLetteredShoutBesideASpeechIsAnotherBlockButFuriganaStaysWithItsColumn() {
        // Real geometry (Ubunchu! ep.1 p.03, scaled 0.6): the shout's own width would allow the gap to the speech.
        var speech = List.of(region(0, "をおいて\n", 447, 560, 460, 619), region(1, "他には無いっ!\n", 423, 559, 439, 662),
            region(2, "わんのか\n", 331, 548, 402, 662));
        assertThat(OcrRegionGrouper.group(speech, "ja", W, H)).extracting(OcrManifest.Region::sourceText)
            .containsExactly("をおいて他には無いっ!", "わんのか\n");
        // Furigana (half-size reading) glued to its column joins it.
        var ruby = List.of(region(0, "迷宮における\n", 100, 100, 124, 300), region(1, "ディレクトリ\n", 126, 100, 136, 160));
        assertThat(OcrRegionGrouper.group(ruby, "ja", W, H)).hasSize(1);
    }

    @Test
    void aTitleLogoOrAWordDrawnOnAnObjectNeverJoinsTheTextBesideIt() {
        // Real cover (Ubunchu! ch01 en, scaled 0.8): a 7x taller logo under its subtitle, a word on a drawn book over
        // the credits. Joined, the logo was erased as "lettering" and the inpainting reached the drawing.
        var subtitle = region(0, "Ubuntu Romantic School Comedy:\n", 216, 40, 628, 62);
        var logo = region(1, "Ubunchu!\n", 31, 48, 772, 202);
        assertThat(OcrRegionGrouper.group(List.of(subtitle, logo), "en", W, H)).extracting(OcrManifest.Region::sourceText)
            .containsExactly("Ubuntu Romantic School Comedy:\n", "Ubunchu!\n");
        var book = region(0, "Ubunty\n", 780, 1102, 846, 1170);
        var credits = region(1, "First Printed In: ASCII Magazine \"Kantan Ubuntu!\"\nPublished by: ASCII MEDIA WORKS Inc.\n", 529, 1161, 968, 1202);
        assertThat(OcrRegionGrouper.group(List.of(book, credits), "en", W, H)).hasSize(2);
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
        var bottom = region(2, "PLEASE!", 100, 165, 200, 195); // next line of the same balloon
        // The provider read the other balloon in between: the heuristic alone would never rejoin them.
        assertThat(OcrRegionGrouper.group(List.of(top, other, bottom), "en", W, H)).hasSize(3);
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

    /** A line of {@code width} x {@code height} px centred at (cx, cy), turned by {@code degrees}. */
    private static OcrManifest.Region slanted(int order, String text, double cx, double cy, double width, double height, double degrees) {
        double a = Math.toRadians(degrees), cos = Math.cos(a), sin = Math.sin(a);
        double[][] corners = {{-width / 2, -height / 2}, {width / 2, -height / 2}, {width / 2, height / 2}, {-width / 2, height / 2}};
        var polygon = new java.util.ArrayList<OcrManifest.Vertex>();
        for (var c : corners) polygon.add(new OcrManifest.Vertex((cx + c[0] * cos - c[1] * sin) / W, (cy + c[0] * sin + c[1] * cos) / H));
        return new OcrManifest.Region(new UUID(0, order + 1), order, text, polygon);
    }

    private static double area(List<OcrManifest.Vertex> p) {
        double sum = 0;
        for (int i = 0; i < p.size(); i++) {
            var a = p.get(i); var b = p.get((i + 1) % p.size());
            sum += a.x() * W * b.y() * H - b.x() * W * a.y() * H;
        }
        return Math.abs(sum) / 2;
    }

    @Test
    void slantedLinesOfOneLetteringGetARectangleAlongTheirSlantNotTheAxisAlignedBoxOfThemAll() {
        // Three lines of hand lettering at 40 degrees, stacked along their normal: a diagonal band across the panel.
        double a = Math.toRadians(40), nx = -Math.sin(a), ny = Math.cos(a);
        var lines = List.of(slanted(0, "The Command\n", 500, 300, 300, 40, 40),
            slanted(1, "Line\n", 500 + 48 * nx, 300 + 48 * ny, 300, 40, 40),
            slanted(2, "Rocks!\n", 500 + 96 * nx, 300 + 96 * ny, 300, 40, 40));
        var grouped = OcrRegionGrouper.group(lines, "en", W, H);
        assertThat(grouped).hasSize(1);
        var polygon = grouped.getFirst().polygon();
        // Tight: about the lines' own area (3 x 300 x 40 plus the gaps), far below the axis-aligned box.
        assertThat(area(polygon)).isLessThan(300 * 140 * 1.15);
        double left = 1, top = 1, right = 0, bottom = 0;
        for (var v : polygon) { left = Math.min(left, v.x()); right = Math.max(right, v.x()); top = Math.min(top, v.y()); bottom = Math.max(bottom, v.y()); }
        assertThat(area(polygon)).isLessThan(.6 * (right - left) * W * (bottom - top) * H);
        // Upright lines keep the axis-aligned box.
        var upright = OcrRegionGrouper.group(List.of(region(0, "HELLO\n", 100, 100, 300, 130), region(1, "THERE\n", 100, 140, 300, 170)), "en", W, H);
        assertThat(upright.getFirst().polygon()).containsExactly(new OcrManifest.Vertex(.1, .1), new OcrManifest.Vertex(.3, .1),
            new OcrManifest.Vertex(.3, .17), new OcrManifest.Vertex(.1, .17));
    }

    @Test
    void slantedLinesInAnArcAroundTheArtAreNotOneRectangleAcrossIt() {
        // Two slanted lines far apart along their normal (an arc around a face): their rectangle would be mostly art.
        double a = Math.toRadians(37), nx = -Math.sin(a), ny = Math.cos(a);
        var arc = List.of(slanted(0, "Command Line\n", 520, 160, 240, 60, 37),
            slanted(1, "Rocks!\n", 520 + 230 * nx, 160 + 230 * ny, 140, 55, 37));
        assertThat(OcrRegionGrouper.tiltedBounds(arc, W, H)).isNotNull();
        var grouped = OcrRegionGrouper.group(arc, "en", W, H);
        assertThat(grouped).extracting(OcrManifest.Region::sourceText).containsExactly("Command Line\n", "Rocks!\n");
    }

    @Test
    void aParagraphIsNeverSplitInsideAWordTheProviderReadWithoutABreak() {
        // A terminal line "pok:/usr$ ls" whose first fragment a loose balloon box covers: one token, not a speech word.
        var balloon = box(80, 80, 320, 200);
        var terminal = new OcrParagraph(region(0, "pok:/usr$ ls", 280, 150, 600, 180), List.of(
            word("pok", 280, 150, 315, 180), word(":/usr$ ", 315, 150, 450, 180), word("ls", 470, 150, 500, 180)));
        assertThat(OcrRegionGrouper.splitByBubbles(List.of(terminal), List.of(balloon))).containsExactly(terminal.region());
        // With a real break the same geometry still splits.
        var spaced = new OcrParagraph(region(1, "pok :/usr$ ls", 280, 150, 600, 180), List.of(
            word("pok ", 280, 150, 315, 180), word(":/usr$ ", 330, 150, 450, 180), word("ls", 470, 150, 500, 180)));
        assertThat(OcrRegionGrouper.splitByBubbles(List.of(spaced), List.of(balloon))).hasSize(2);
        // Japanese has no breaks between words: the rule does not apply and a paragraph across two balloons splits.
        var japanese = new OcrParagraph(region(2, "三人しか居ません", 100, 150, 600, 180), List.of(
            word("三人", 100, 150, 200, 180), word("しか", 210, 150, 300, 180), word("居", 400, 150, 450, 180), word("ません", 460, 150, 560, 180)));
        assertThat(OcrRegionGrouper.splitByBubbles(List.of(japanese), List.of(balloon, box(380, 80, 620, 200)))).hasSize(2);
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

    @Test
    void overlappingBoxesOfSlantedHandLetteringAreOneCaption() {
        // Real boxes from Ubunchu! ch02 p.04 (2044 px wide page scaled to this 1000 px fixture keeps the ratios).
        var first = region(0, "We can\nbe the\n", 334, 221, 428, 303);
        var second = region(1, "GUI Brigade!\n", 349, 265, 514, 344);
        var result = OcrRegionGrouper.group(List.of(first, second), "en", W, H);
        assertThat(result).extracting(OcrManifest.Region::sourceText).containsExactly("We can be the GUI Brigade!");
        // Touching corners only (tiny shared area) stay apart.
        var far = region(1, "OTHER\n", 420, 295, 600, 380);
        assertThat(OcrRegionGrouper.group(List.of(first, far), "en", W, H)).hasSize(2);
    }

    @Test
    void distantParagraphsInsideOneLargeBoxStayApartAndCutLinesRejoinTheirBalloon() {
        // One detector box covering a shout at the top and a caption far below: two speeches, not one.
        var shout = region(0, "GET OUT NOOB\n", 100, 100, 260, 130);
        var caption = region(1, "BUT... EVENTUALLY I CAUSED A FLAME WAR.\n", 100, 400, 400, 430);
        assertThat(OcrRegionGrouper.group(List.of(shout, caption), "en", W, H, List.of(box(80, 80, 420, 450)))).hasSize(2);
        // A loose box cut the second line of a speech: it is outside the box but within its slack, so it rejoins.
        var first = region(0, "CAN I HAVE A MOMENT\n", 100, 100, 300, 130);
        var second = region(1, "OF YOUR TIME?\n", 130, 138, 270, 168);
        assertThat(OcrRegionGrouper.group(List.of(first, second), "en", W, H, List.of(box(90, 90, 310, 150))))
            .extracting(OcrManifest.Region::sourceText).containsExactly("CAN I HAVE A MOMENT OF YOUR TIME?");
    }

    @Test
    void aBigSoundEffectAboveACaptionIsNotTheSameSpeech() {
        // Real boxes (ep.1 p.04, scaled): one-line effect 47 px high, two-line caption ~25 px per line right under it.
        var effect = region(0, "カタカタカタカタカタカタナ\n", 60, 552, 453, 588);
        var caption = region(1, "でこの\nアイコンを\n", 79, 611, 178, 650);
        assertThat(OcrRegionGrouper.group(List.of(effect, caption), "ja", W, H)).hasSize(2);
    }
}
