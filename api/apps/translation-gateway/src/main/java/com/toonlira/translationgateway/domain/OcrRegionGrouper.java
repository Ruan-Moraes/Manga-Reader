package com.toonlira.translationgateway.domain;

import com.toonlira.translationgateway.domain.layout.LayoutBox;
import com.toonlira.translationgateway.domain.layout.LayoutGeometry;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
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
    /**
     * Detected balloon boxes are loose rectangles: a word or a region belongs to the single balloon holding most of
     * it (mixed paragraphs were already split word by word, so a region is never half speech, half effect).
     */
    private static final double WORD_CONTAINMENT = .5;
    private static final int OUTSIDE = -1, AMBIGUOUS = -2;

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
        var units = new LinkedHashMap<Object, List<OcrManifest.Region>>();
        List<OcrManifest.Region> freeRun = null;
        for (var region : regions) {
            int bubble = bubbleOf(region, bubbles);
            if (bubble >= 0) {
                var unit = units.computeIfAbsent(bubble, ignored -> new ArrayList<>());
                int chars = region.sourceText().length();
                for (var member : unit) chars += member.sourceText().length();
                // Oversized balloons keep their extra paragraphs apart rather than exceeding the merge budget.
                if (chars > MAX_MERGED_CHARS) units.put(new Object(), new ArrayList<>(List.of(region)));
                else unit.add(region);
                freeRun = null;
                continue;
            }
            if (freeRun != null && sameBubble(freeRun.getLast(), region, widthPx, heightPx, freeRun)) {
                freeRun.add(region);
                continue;
            }
            freeRun = new ArrayList<>(List.of(region));
            units.put(new Object(), freeRun);
        }
        var merged = new ArrayList<OcrManifest.Region>();
        for (var unit : units.values()) flush(new ArrayList<>(unit), merged, widthPx, heightPx);
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
            var owners = words.stream().mapToInt(word -> bubbleOf(word.polygon(), bubbles, WORD_CONTAINMENT)).toArray();
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

    private static int bubbleOf(List<OcrManifest.Vertex> polygon, List<LayoutBox> bubbles, double containment) {
        int found = OUTSIDE;
        for (int i = 0; i < bubbles.size(); i++) {
            if (LayoutGeometry.containment(polygon, bubbles.get(i)) < containment) continue;
            if (found != OUTSIDE) return AMBIGUOUS;
            found = i;
        }
        return found;
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
        return minHeight > 0 && minWidth > 0 && gap <= MAX_GAP_RATIO * minHeight && gap >= MIN_OVERLAP_GAP_RATIO * minHeight
            && overlap >= MIN_HORIZONTAL_OVERLAP * minWidth && chars <= MAX_MERGED_CHARS;
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
