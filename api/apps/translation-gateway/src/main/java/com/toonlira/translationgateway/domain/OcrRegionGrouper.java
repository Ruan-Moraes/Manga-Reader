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
                    boolean close = near(unit.members(), region, widthPx, heightPx)
                        || unit == last && sameBubble(unit.members().getLast(), region, widthPx, heightPx, unit.members());
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

    /** Close to some line of the speech: overlapping, stacked (small vertical gap) or on the same line. */
    private static boolean near(List<OcrManifest.Region> members, OcrManifest.Region region, int w, int h) {
        var b = box(region, w, h);
        for (var member : members) {
            var a = box(member, w, h);
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
        var boxA = box(a, w, h);
        var boxB = box(b, w, h);
        double minHeight = Math.min(boxA[3] - boxA[1], boxB[3] - boxB[1]);
        double gap = boxB[1] - boxA[3];
        double overlap = Math.min(boxA[2], boxB[2]) - Math.max(boxA[0], boxB[0]);
        double minWidth = Math.min(boxA[2] - boxA[0], boxB[2] - boxB[0]);
        int chars = b.sourceText().length();
        for (var member : run) chars += member.sourceText().length();
        if (minHeight <= 0 || minWidth <= 0 || chars > MAX_MERGED_CHARS) return false;
        // Boxes covering each other are one block of text: slanted or hand-lettered lines that the provider split
        // ("We can be the" / "GUI Brigade!") overlap; distinct paragraphs practically never do.
        double overlapHeight = Math.min(boxA[3], boxB[3]) - Math.max(boxA[1], boxB[1]);
        double smallerArea = Math.min((boxA[2] - boxA[0]) * (boxA[3] - boxA[1]), (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]));
        if (overlap > 0 && overlapHeight > 0 && overlap * overlapHeight >= MIN_SHARED_AREA * smallerArea) return true;
        return gap <= MAX_GAP_RATIO * minHeight && gap >= MIN_OVERLAP_GAP_RATIO * minHeight
            && overlap >= MIN_HORIZONTAL_OVERLAP * minWidth;
    }

    private static void flush(List<OcrManifest.Region> run, List<OcrManifest.Region> out, int w, int h) {
        if (run.isEmpty()) return;
        if (run.size() == 1) { out.add(run.getFirst()); run.clear(); return; }
        double left = 1, top = 1, right = 0, bottom = 0;
        var text = new StringBuilder();
        for (var region : run) {
            for (var vertex : region.polygon()) {
                left = Math.min(left, vertex.x()); right = Math.max(right, vertex.x());
                top = Math.min(top, vertex.y()); bottom = Math.max(bottom, vertex.y());
            }
            if (!text.isEmpty()) text.append(' ');
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
