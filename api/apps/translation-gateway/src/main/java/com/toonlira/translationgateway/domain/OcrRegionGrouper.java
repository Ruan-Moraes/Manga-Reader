package com.toonlira.translationgateway.domain;

import com.toonlira.translationgateway.domain.layout.LayoutBox;
import com.toonlira.translationgateway.domain.layout.LayoutGeometry;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Merges consecutive OCR paragraphs that are stacked lines of the same speech bubble, so a sentence is translated and
 * typeset as one unit instead of several tiny fragments. Heuristic and deliberately conservative: only horizontal
 * Latin-script sources, only reading-order neighbours that are vertically tight and horizontally overlapping.
 * Vertical CJK text is left untouched.
 */
public final class OcrRegionGrouper {
    private static final Set<String> HORIZONTAL_LANGUAGES = Set.of("en", "es", "pt-BR");
    /** CJK sources and how the lines of one speech are joined: no space in Japanese/Chinese, a space in Korean. */
    private static final java.util.Map<String, String> CJK_JOINERS = java.util.Map.of("ja", "", "zh-Hans", "", "zh-Hant", "", "ko", " ");
    /** A text box at least this much taller than wide is a vertical column. */
    private static final double VERTICAL_RATIO = 1.5;
    /** Neighbouring columns of one speech: horizontal gap (in column widths) and minimum vertical overlap. */
    private static final double COLUMN_GAP = 1.0, COLUMN_OVERLAP = .3;
    /** Detector boxes sharing less than this share of the smaller one are different balloons. */
    private static final double DISTINCT_BALLOON_OVERLAP = .1;
    /** Stacked lines whose line heights differ more than this are different blocks. */
    private static final double MAX_LINE_RATIO = 1.75;
    private static final double MAX_GAP_RATIO = 0.8, MIN_OVERLAP_GAP_RATIO = -0.25, MIN_HORIZONTAL_OVERLAP = 0.4;
    private static final int MAX_MERGED_CHARS = 1500;
    /** Share of the smaller box two paragraph boxes must share to be one block of (slanted) text. */
    private static final double MIN_SHARED_AREA = .25;
    /** Inside one detected balloon: max gap (in line heights) and min horizontal overlap between lines of a speech. */
    private static final double NEAR_GAP_RATIO = 1.5, NEAR_OVERLAP = .2;
    /**
     * Detected balloon boxes are loose rectangles: a word or a region belongs to the single balloon holding most of
     * it (mixed paragraphs were already split word by word, so a region is never half speech, half effect).
     */
    private static final double WORD_CONTAINMENT = .5;
    private static final int OUTSIDE = -1, AMBIGUOUS = -2;
    /** Containment lead one balloon box needs over another to own a line. */
    private static final double CLEAR_WIN = .15;
    /** Word split thresholds: clearly inside a balloon box / clearly outside every box. */
    private static final double WORD_INSIDE = .8, WORD_OUTSIDE = .2;

    private OcrRegionGrouper() { }

    public static List<OcrManifest.Region> group(List<OcrManifest.Region> regions, String sourceLanguage,
                                                 int widthPx, int heightPx) {
        if (regions != null && regions.size() >= 2 && CJK_JOINERS.containsKey(sourceLanguage))
            return groupCjk(regions, sourceLanguage, widthPx, heightPx, null);
        if (regions == null || regions.size() < 2 || !HORIZONTAL_LANGUAGES.contains(sourceLanguage)) return regions;
        var merged = new ArrayList<OcrManifest.Region>();
        var run = new ArrayList<OcrManifest.Region>();
        for (var region : regions) {
            if (!run.isEmpty() && !sameBubble(run.getLast(), region, widthPx, heightPx, run)) flush(run, merged, widthPx, heightPx);
            run.add(region);
        }
        flush(run, merged, widthPx, heightPx);
        var result = new ArrayList<OcrManifest.Region>(merged.size());
        for (var region : merged) result.add(new OcrManifest.Region(region.id(), result.size(), region.sourceText(), region.polygon()));
        return List.copyOf(result);
    }

    /**
     * Balloon-aware grouping: paragraphs inside the same detected balloon form one region (placed at its first
     * paragraph's reading position), paragraphs in different balloons or one inside and one outside a balloon are
     * never merged. Only text outside every balloon falls back to the proximity heuristic. A paragraph contained in
     * several balloons is ambiguous and treated as outside. The detector's boxes never change any paragraph's text.
     */
    public static List<OcrManifest.Region> group(List<OcrManifest.Region> regions, String sourceLanguage,
                                                 int widthPx, int heightPx, List<LayoutBox> bubbles) {
        if (bubbles == null) return group(regions, sourceLanguage, widthPx, heightPx);
        if (regions != null && regions.size() >= 2 && CJK_JOINERS.containsKey(sourceLanguage))
            return groupCjk(regions, sourceLanguage, widthPx, heightPx, bubbles);
        if (regions == null || regions.size() < 2 || !HORIZONTAL_LANGUAGES.contains(sourceLanguage)) return regions;
        record Unit(int bubble, List<OcrManifest.Region> members) { }
        var units = new ArrayList<Unit>();
        Unit last = null;
        for (var region : regions) {
            int bubble = bubbleOf(region, bubbles);
            Unit target = null;
            if (bubble >= 0) {
                // Same balloon AND close to one of the speech's lines: a big or loose detector box may hold several
                // speeches or effects, which must not be glued together ("GET OUT NOOB" + a distant caption).
                for (int u = units.size() - 1; u >= 0 && target == null; u--) {
                    var unit = units.get(u);
                    // Inside one detected balloon a size difference is emphasis ("YOU LINUX / FREAKS ARE SO ANNOYING!").
                    boolean close = near(unit.members(), region, widthPx, heightPx, false)
                        || unit == last && sameBubble(unit.members().getLast(), region, widthPx, heightPx, unit.members(), false);
                    if (unit.bubble() == bubble && close && chars(unit.members(), region) <= MAX_MERGED_CHARS) target = unit;
                }
            } else if (last != null && sameBubble(last.members().getLast(), region, widthPx, heightPx, last.members())
                && (last.bubble() < 0 || insideWithSlack(region, bubbles.get(last.bubble())) || continuesSpeech(region))) {
                // A line stacked right under a speech continues it. Into a balloon speech when the line still lies
                // mostly in that balloon's box widened by the detector slack, or reads as a continuation (several
                // words, or bare punctuation): loose boxes cut "CAN I HAVE A MOMENT / OF YOUR TIME?". A lone word
                // beside a balloon is the profile of a sound effect ("clatter") and stays apart.
                target = last;
            }
            if (target == null) {
                target = new Unit(bubble, new ArrayList<>());
                units.add(target);
            }
            target.members().add(region);
            last = target;
        }
        var merged = new ArrayList<OcrManifest.Region>();
        for (var unit : units) flush(new ArrayList<>(unit.members()), merged, widthPx, heightPx);
        var result = new ArrayList<OcrManifest.Region>(merged.size());
        for (var region : merged) result.add(new OcrManifest.Region(region.id(), result.size(), region.sourceText(), region.polygon()));
        return List.copyOf(result);
    }

    /**
     * Splits a provider paragraph whose words fall in different balloons, or partly inside and partly outside one
     * (Vision may read "YOU LINUX clatter" as one paragraph across a balloon border). Each run of consecutive words
     * with the same balloon becomes its own region with a derived stable ID; paragraphs without word geometry, or
     * whose words agree, are kept unchanged. Word texts are never altered, only partitioned.
     */
    public static List<OcrManifest.Region> splitByBubbles(List<OcrParagraph> paragraphs, List<LayoutBox> bubbles) {
        var result = new ArrayList<OcrManifest.Region>();
        for (var paragraph : paragraphs) {
            var words = paragraph.words();
            if (bubbles == null || words.size() < 2 || words.stream().anyMatch(word -> !OcrGeometry.valid(word.polygon()))) {
                result.add(paragraph.region());
                continue;
            }
            var owners = words.stream().mapToInt(word -> wordOwner(word.polygon(), bubbles)).toArray();
            // A word inside overlapping balloon boxes is ambiguous: it never causes a split and follows its neighbours.
            if (java.util.Arrays.stream(owners).filter(owner -> owner != AMBIGUOUS).distinct().count() <= 1) {
                result.add(paragraph.region());
                continue;
            }
            for (int i = 0; i < owners.length; i++) if (owners[i] == AMBIGUOUS) owners[i] = i > 0 ? owners[i - 1] : nextKnown(owners);
            int start = 0, part = 0;
            for (int i = 1; i <= words.size(); i++) {
                if (i < words.size() && owners[i] == owners[start]) continue;
                var run = words.subList(start, i);
                var text = new StringBuilder();
                for (var word : run) text.append(word.text());
                var polygon = bounds(run.stream().map(OcrParagraph.Word::polygon).toList());
                var id = UUID.nameUUIDFromBytes((paragraph.region().id() + ":split:" + part++).getBytes(StandardCharsets.UTF_8));
                if (!text.toString().isBlank() && OcrGeometry.valid(polygon))
                    result.add(new OcrManifest.Region(id, result.size(), text.toString().strip(), polygon));
                start = i;
            }
        }
        return List.copyOf(result);
    }

    /**
     * Word-level owner for splitting: a balloon only when the word is clearly in it (>= {@link #WORD_INSIDE}, and
     * clearly more than in any other box), outside only when clearly out of every box (<= {@link #WORD_OUTSIDE}).
     * A word a loose box merely cuts ("GET OUT" at 43%, "post." beside "AH!!") is ambiguous and never splits.
     */
    private static int wordOwner(List<OcrManifest.Vertex> polygon, List<LayoutBox> bubbles) {
        int best = OUTSIDE;
        double first = 0, second = 0;
        for (int i = 0; i < bubbles.size(); i++) {
            double share;
            try { share = LayoutGeometry.containment(polygon, bubbles.get(i)); } catch (RuntimeException invalid) { continue; }
            if (share > first) { second = first; first = share; best = i; }
            else if (share > second) second = share;
        }
        if (first <= WORD_OUTSIDE) return OUTSIDE;
        if (first >= WORD_INSIDE && first - second >= CLEAR_WIN) return best;
        return AMBIGUOUS;
    }

    private static int nextKnown(int[] owners) {
        for (int owner : owners) if (owner != AMBIGUOUS) return owner;
        return OUTSIDE;
    }

    private static List<OcrManifest.Vertex> bounds(List<List<OcrManifest.Vertex>> polygons) {
        double left = 1, top = 1, right = 0, bottom = 0;
        for (var polygon : polygons) for (var vertex : polygon) {
            left = Math.min(left, vertex.x()); right = Math.max(right, vertex.x());
            top = Math.min(top, vertex.y()); bottom = Math.max(bottom, vertex.y());
        }
        return List.of(new OcrManifest.Vertex(left, top), new OcrManifest.Vertex(right, top),
            new OcrManifest.Vertex(right, bottom), new OcrManifest.Vertex(left, bottom));
    }

    /** Region-level owner: ambiguous regions are treated as outside every balloon (never merged by balloon). */
    private static int bubbleOf(OcrManifest.Region region, List<LayoutBox> bubbles) {
        int owner = bubbleOf(region.polygon(), bubbles, WORD_CONTAINMENT);
        return owner == AMBIGUOUS ? OUTSIDE : owner;
    }

    /**
     * The balloon containing the text clearly most. Detector boxes of neighbouring balloons overlap, so a line can
     * be fully inside its own box and half inside the next one; it is ambiguous only when two boxes hold it about
     * equally (within {@link #CLEAR_WIN}).
     */
    private static int bubbleOf(List<OcrManifest.Vertex> polygon, List<LayoutBox> bubbles, double containment) {
        int best = OUTSIDE;
        double first = 0, second = 0;
        for (int i = 0; i < bubbles.size(); i++) {
            double share;
            try { share = LayoutGeometry.containment(polygon, bubbles.get(i)); } catch (RuntimeException invalid) { continue; }
            if (share < containment) continue;
            if (share > first) { second = first; first = share; best = i; }
            else if (share > second) second = share;
        }
        if (best != OUTSIDE && second > 0 && first - second < CLEAR_WIN) return AMBIGUOUS;
        return best;
    }

    /** Detector boxes are loose: same slack as the renderer uses to bound a balloon. */
    static final double BALLOON_SLACK = .15;

    private static boolean insideWithSlack(OcrManifest.Region region, LayoutBox box) {
        double dx = (box.right() - box.left()) * BALLOON_SLACK, dy = (box.bottom() - box.top()) * BALLOON_SLACK;
        var widened = new LayoutBox(Math.max(0, box.left() - dx), Math.max(0, box.top() - dy),
            Math.min(1, box.right() + dx), Math.min(1, box.bottom() + dy));
        try { return LayoutGeometry.containment(region.polygon(), widened) >= .5; }
        catch (RuntimeException invalid) { return false; }
    }

    private static boolean continuesSpeech(OcrManifest.Region region) {
        var text = region.sourceText().strip();
        if (text.codePoints().noneMatch(Character::isLetterOrDigit)) return true;
        int words = 0;
        for (var token : text.split("\\s+")) if (token.codePoints().anyMatch(Character::isLetter)) words++;
        return words >= 2;
    }

    private static int chars(List<OcrManifest.Region> members, OcrManifest.Region region) {
        int chars = region.sourceText().length();
        for (var member : members) chars += member.sourceText().length();
        return chars;
    }

    /**
     * Lettering of two paragraphs is of different size: per-line heights differ by more than {@link #MAX_LINE_RATIO}
     * and the area per letter (sqrt(area / letters), blind to slant) by more than {@link #AREA_GLYPH_RATIO}. Slanted
     * hand lettering inflates its box height but not its area per letter, so it still joins.
     */
    private static boolean differentLineSize(OcrManifest.Region a, OcrManifest.Region b, double[] boxA, double[] boxB) {
        double lineA = (boxA[3] - boxA[1]) / lines(a), lineB = (boxB[3] - boxB[1]) / lines(b);
        if (lineA <= 0 || lineB <= 0 || Math.max(lineA, lineB) <= MAX_LINE_RATIO * Math.min(lineA, lineB)) return false;
        double glyphA = areaGlyph(a, boxA), glyphB = areaGlyph(b, boxB);
        return glyphA > 0 && glyphB > 0 && Math.max(glyphA, glyphB) > AREA_GLYPH_RATIO * Math.min(glyphA, glyphB);
    }

    private static final double AREA_GLYPH_RATIO = 1.5;

    private static double areaGlyph(OcrManifest.Region region, double[] box) {
        long letters = region.sourceText().codePoints().filter(Character::isLetterOrDigit).count();
        return letters == 0 ? 0 : Math.sqrt((box[2] - box[0]) * (box[3] - box[1]) / letters);
    }

    /** Close to some line of the speech: overlapping, stacked (small vertical gap) or on the same line. */
    private static boolean near(List<OcrManifest.Region> members, OcrManifest.Region region, int w, int h) {
        return near(members, region, w, h, true);
    }

    /** {@code bySize}: lettering of very different size is not near (off inside one detected balloon: emphasis). */
    private static boolean near(List<OcrManifest.Region> members, OcrManifest.Region region, int w, int h, boolean bySize) {
        var b = box(region, w, h);
        for (var member : members) {
            var a = box(member, w, h);
            if (bySize && differentLineSize(member, region, a, b)) continue;
            double minHeight = Math.min(a[3] - a[1], b[3] - b[1]), minWidth = Math.min(a[2] - a[0], b[2] - b[0]);
            if (minHeight <= 0 || minWidth <= 0) continue;
            double horizontalOverlap = Math.min(a[2], b[2]) - Math.max(a[0], b[0]);
            double verticalOverlap = Math.min(a[3], b[3]) - Math.max(a[1], b[1]);
            double verticalGap = Math.max(a[1], b[1]) - Math.min(a[3], b[3]);
            double horizontalGap = Math.max(a[0], b[0]) - Math.min(a[2], b[2]);
            boolean stacked = verticalGap <= NEAR_GAP_RATIO * minHeight && horizontalOverlap >= NEAR_OVERLAP * minWidth;
            boolean sameLine = verticalOverlap >= .5 * minHeight && horizontalGap <= NEAR_GAP_RATIO * minHeight;
            if (stacked || sameLine) return true;
        }
        return false;
    }

    private static boolean sameBubble(OcrManifest.Region a, OcrManifest.Region b, int w, int h, List<OcrManifest.Region> run) {
        return sameBubble(a, b, w, h, run, true);
    }

    private static boolean sameBubble(OcrManifest.Region a, OcrManifest.Region b, int w, int h, List<OcrManifest.Region> run,
                                      boolean bySize) {
        var boxA = box(a, w, h);
        var boxB = box(b, w, h);
        double minHeight = Math.min(boxA[3] - boxA[1], boxB[3] - boxB[1]);
        double gap = boxB[1] - boxA[3];
        double overlap = Math.min(boxA[2], boxB[2]) - Math.max(boxA[0], boxB[0]);
        double minWidth = Math.min(boxA[2] - boxA[0], boxB[2] - boxB[0]);
        int chars = b.sourceText().length();
        for (var member : run) chars += member.sourceText().length();
        if (minHeight <= 0 || minWidth <= 0 || chars > MAX_MERGED_CHARS) return false;
        // Lettering of very different size is a different block, even overlapping: a title logo under its subtitle
        // ("Ubunchu!" 7x the line height), a word drawn on an object beside the credits.
        if (bySize && differentLineSize(a, b, boxA, boxB)) return false;
        // Boxes covering each other are one block of text: slanted or hand-lettered lines that the provider split
        // ("We can be the" / "GUI Brigade!") overlap; distinct paragraphs practically never do.
        double overlapHeight = Math.min(boxA[3], boxB[3]) - Math.max(boxA[1], boxB[1]);
        double smallerArea = Math.min((boxA[2] - boxA[0]) * (boxA[3] - boxA[1]), (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]));
        if (overlap > 0 && overlapHeight > 0 && overlap * overlapHeight >= MIN_SHARED_AREA * smallerArea) return true;
        return gap <= MAX_GAP_RATIO * minHeight && gap >= MIN_OVERLAP_GAP_RATIO * minHeight
            && overlap >= MIN_HORIZONTAL_OVERLAP * minWidth;
    }

    /**
     * CJK speeches: vertical columns side by side (the provider returns each column as a paragraph, not in reading
     * order) and stacked horizontal lines form one speech; with balloons, only within the same balloon. Members are
     * read in order (vertical: right-to-left columns, each top-down; horizontal: top-down) and joined without
     * spaces for Japanese/Chinese. Detector boxes only bound which lines may join; they never change text.
     */
    static List<OcrManifest.Region> groupCjk(List<OcrManifest.Region> regions, String language, int w, int h,
                                             List<LayoutBox> bubbles) {
        final class Unit {
            int bubble;
            final List<OcrManifest.Region> members = new ArrayList<>();
            Unit(int bubble) { this.bubble = bubble; }
            List<OcrManifest.Region> members() { return members; }
        }
        var units = new ArrayList<Unit>();
        for (var region : regions) {
            int bubble = bubbles == null ? OUTSIDE : bubbleOf(region, bubbles);
            Unit target = null;
            for (int u = units.size() - 1; u >= 0 && target == null; u--) {
                var unit = units.get(u);
                // Balloons veto, they do not require: lines clearly in two different balloons never join, while a
                // column a loose box missed still joins its neighbours.
                if (bubble >= 0 && unit.bubble >= 0 && unit.bubble != bubble
                    && distinctBalloons(bubbles.get(unit.bubble), bubbles.get(bubble))) continue;
                if (chars(unit.members(), region) > MAX_MERGED_CHARS) continue;
                // Clearly inside the same balloon is one speech even when the lettering is far apart: a column
                // broken by a pause (「こっ」 「この」) or widened by Latin letters (「CCSMって」) next to it. Only for
                // lettering of the same kind: screen text, digits or a small hand-written aside in the box is not.
                if (bubble >= 0 && unit.bubble == bubble) {
                    for (var member : unit.members()) if (sameLettering(member, region, w, h)) { target = unit; break; }
                    if (target != null) break;
                }
                for (var member : unit.members()) if (sameCjkSpeech(member, region, w, h)) { target = unit; break; }
            }
            if (target == null) { target = new Unit(bubble); units.add(target); }
            else if (target.bubble < 0 && bubble >= 0) target.bubble = bubble;
            target.members().add(region);
        }
        var result = new ArrayList<OcrManifest.Region>(units.size());
        for (var unit : units) {
            var members = new ArrayList<>(unit.members());
            if (members.size() == 1) {
                var only = members.getFirst();
                result.add(new OcrManifest.Region(only.id(), result.size(), only.sourceText(), only.polygon()));
                continue;
            }
            long vertical = members.stream().filter(m -> isVertical(m, w, h)).count();
            if (vertical * 2 >= members.size()) {
                // Right-to-left columns; within one column (same x span) top-down.
                members.sort((a, b) -> {
                    var ba = box(a, w, h); var bb = box(b, w, h);
                    double overlap = Math.min(ba[2], bb[2]) - Math.max(ba[0], bb[0]);
                    if (overlap > .5 * Math.min(ba[2] - ba[0], bb[2] - bb[0])) return Double.compare(ba[1], bb[1]);
                    return Double.compare(bb[2], ba[2]);
                });
            } else {
                members.sort((a, b) -> Double.compare(box(a, w, h)[1], box(b, w, h)[1]));
            }
            var text = new StringBuilder();
            double left = 1, top = 1, right = 0, bottom = 0;
            for (var member : members) {
                var part = member.sourceText().strip().replaceAll("\\s*\\R\\s*", CJK_JOINERS.get(language));
                if (!text.isEmpty() && !part.isEmpty()) text.append(CJK_JOINERS.get(language));
                text.append(part);
                for (var vertex : member.polygon()) {
                    left = Math.min(left, vertex.x()); right = Math.max(right, vertex.x());
                    top = Math.min(top, vertex.y()); bottom = Math.max(bottom, vertex.y());
                }
            }
            var polygon = List.of(new OcrManifest.Vertex(left, top), new OcrManifest.Vertex(right, top),
                new OcrManifest.Vertex(right, bottom), new OcrManifest.Vertex(left, bottom));
            if (OcrGeometry.valid(polygon)) result.add(new OcrManifest.Region(members.getFirst().id(), result.size(), text.toString(), polygon));
            else for (var member : members) result.add(new OcrManifest.Region(member.id(), result.size(), member.sourceText(), member.polygon()));
        }
        return List.copyOf(result);
    }

    /**
     * Two detector boxes are different balloons only when they barely overlap: on vertical Japanese balloons the
     * detector often returns several partial, overlapping boxes for one balloon.
     */
    private static boolean distinctBalloons(LayoutBox a, LayoutBox b) {
        double overlap = Math.max(0, Math.min(a.right(), b.right()) - Math.max(a.left(), b.left()))
            * Math.max(0, Math.min(a.bottom(), b.bottom()) - Math.max(a.top(), b.top()));
        double smaller = Math.min((a.right() - a.left()) * (a.bottom() - a.top()), (b.right() - b.left()) * (b.bottom() - b.top()));
        return smaller <= 0 || overlap < DISTINCT_BALLOON_OVERLAP * smaller;
    }

    /** Both written in a CJK script with glyphs of similar size (within {@link #MAX_LINE_RATIO}). */
    private static boolean sameLettering(OcrManifest.Region a, OcrManifest.Region b, int w, int h) {
        if (!hasCjkScript(a.sourceText()) || !hasCjkScript(b.sourceText())) return false;
        double glyphA = glyph(a, w, h), glyphB = glyph(b, w, h);
        return glyphA > 0 && glyphB > 0 && Math.max(glyphA, glyphB) <= MAX_LINE_RATIO * Math.min(glyphA, glyphB);
    }

    /**
     * Glyph size of square-glyph lettering: sqrt(box area / letters). Robust to how the provider laid the block out
     * — two vertical columns returned as one paragraph of two "lines" (「じゃあ⏎これ」) measure like their neighbours.
     */
    /** Glyph size ratio from which two columns are different lettering unless glued (furigana is about 2x). */
    static final double SIZE_JUMP = 2.2;

    private static double glyph(OcrManifest.Region region, int w, int h) {
        var b = box(region, w, h);
        long letters = region.sourceText().codePoints().filter(Character::isLetterOrDigit).count();
        return letters == 0 ? 0 : Math.sqrt((b[2] - b[0]) * (b[3] - b[1]) / letters);
    }

    private static boolean hasCjkScript(String text) {
        return text.codePoints().anyMatch(c -> switch (Character.UnicodeScript.of(c)) {
            case HAN, HIRAGANA, KATAKANA, HANGUL -> true;
            default -> false;
        });
    }

    /** Words a provider paragraph needs, on each side, for the break between two of them to be kept. */
    static final int MIN_PARAGRAPH_WORDS = 15, MIN_PARAGRAPH_LINES = 3;

    /**
     * Two long provider paragraphs where the first ends a sentence: a page of instructions or credits, whose paragraph
     * break the reader expects to keep. Speech in a balloon (short paragraphs) is joined by a space as before.
     */
    static boolean paragraphBreak(OcrManifest.Region previous, OcrManifest.Region next) {
        if (previous == null) return false;
        for (var region : List.of(previous, next)) {
            if (lines(region) < MIN_PARAGRAPH_LINES || region.sourceText().strip().split("\\s+").length < MIN_PARAGRAPH_WORDS) return false;
        }
        return previous.sourceText().strip().matches("(?s).*[.!?:…][\"'”’)]?");
    }

    /** Lines of a provider paragraph (it ends each line with a break). */
    private static int lines(OcrManifest.Region region) {
        return Math.max(1, (int) region.sourceText().strip().lines().count());
    }

    private static boolean isVertical(OcrManifest.Region region, int w, int h) {
        var b = box(region, w, h);
        return b[3] - b[1] >= VERTICAL_RATIO * (b[2] - b[0]);
    }

    /** Neighbouring vertical columns, stacked horizontal lines, or overlapping boxes. */
    private static boolean sameCjkSpeech(OcrManifest.Region a, OcrManifest.Region b, int w, int h) {
        var ba = box(a, w, h); var bb = box(b, w, h);
        double horizontalGap = Math.max(ba[0], bb[0]) - Math.min(ba[2], bb[2]);
        double verticalOverlap = Math.min(ba[3], bb[3]) - Math.max(ba[1], bb[1]);
        double overlapArea = Math.max(0, Math.min(ba[2], bb[2]) - Math.max(ba[0], bb[0])) * Math.max(0, verticalOverlap);
        double smaller = Math.min((ba[2] - ba[0]) * (ba[3] - ba[1]), (bb[2] - bb[0]) * (bb[3] - bb[1]));
        if (smaller > 0 && overlapArea >= MIN_SHARED_AREA * smaller) return true;
        if (isVertical(a, w, h) && isVertical(b, w, h)) {
            double width = Math.max(ba[2] - ba[0], bb[2] - bb[0]), narrower = Math.min(ba[2] - ba[0], bb[2] - bb[0]);
            // Lettering of very different size joins only when glued (furigana beside its column): a big hand-lettered
            // shout (「わんのか」) a column away from a speech is another block, though its width alone allows the gap.
            double glyphA = glyph(a, w, h), glyphB = glyph(b, w, h);
            if (glyphA > 0 && glyphB > 0 && Math.max(glyphA, glyphB) > SIZE_JUMP * Math.min(glyphA, glyphB)
                && horizontalGap > narrower) return false;
            double shorter = Math.min(ba[3] - ba[1], bb[3] - bb[1]);
            return horizontalGap <= COLUMN_GAP * width && verticalOverlap >= COLUMN_OVERLAP * shorter;
        }
        if (!isVertical(a, w, h) && !isVertical(b, w, h)) {
            // Lettering of very different size is a different block: a sound effect over a caption ("カタカタ…").
            double lineA = (ba[3] - ba[1]) / lines(a), lineB = (bb[3] - bb[1]) / lines(b);
            if (Math.max(lineA, lineB) > MAX_LINE_RATIO * Math.min(lineA, lineB)) return false;
            double minHeight = Math.min(ba[3] - ba[1], bb[3] - bb[1]);
            double horizontalOverlap = Math.min(ba[2], bb[2]) - Math.max(ba[0], bb[0]);
            double verticalGap = Math.max(ba[1], bb[1]) - Math.min(ba[3], bb[3]);
            return verticalGap <= MAX_GAP_RATIO * minHeight && verticalGap >= MIN_OVERLAP_GAP_RATIO * minHeight
                && horizontalOverlap >= MIN_HORIZONTAL_OVERLAP * Math.min(ba[2] - ba[0], bb[2] - bb[0]);
        }
        return false;
    }

    private static void flush(List<OcrManifest.Region> run, List<OcrManifest.Region> out, int w, int h) {
        if (run.isEmpty()) return;
        if (run.size() == 1) { out.add(run.getFirst()); run.clear(); return; }
        double left = 1, top = 1, right = 0, bottom = 0;
        var text = new StringBuilder();
        OcrManifest.Region previous = null;
        for (var region : run) {
            for (var vertex : region.polygon()) {
                left = Math.min(left, vertex.x()); right = Math.max(right, vertex.x());
                top = Math.min(top, vertex.y()); bottom = Math.max(bottom, vertex.y());
            }
            if (!text.isEmpty()) text.append(paragraphBreak(previous, region) ? "\n\n" : " ");
            previous = region;
            text.append(region.sourceText().strip().replaceAll("\\s*\\R\\s*", " "));
        }
        var polygon = List.of(new OcrManifest.Vertex(left, top), new OcrManifest.Vertex(right, top),
            new OcrManifest.Vertex(right, bottom), new OcrManifest.Vertex(left, bottom));
        if (OcrGeometry.valid(polygon)) out.add(new OcrManifest.Region(run.getFirst().id(), 0, text.toString(), polygon));
        else out.addAll(run);
        run.clear();
    }

    private static double[] box(OcrManifest.Region region, int w, int h) {
        double left = 1, top = 1, right = 0, bottom = 0;
        for (var vertex : region.polygon()) {
            left = Math.min(left, vertex.x()); right = Math.max(right, vertex.x());
            top = Math.min(top, vertex.y()); bottom = Math.max(bottom, vertex.y());
        }
        return new double[]{left * w, top * h, right * w, bottom * h};
    }
}
