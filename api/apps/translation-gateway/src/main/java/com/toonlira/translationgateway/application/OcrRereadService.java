package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.LexiconPort;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.application.port.RereadImagingPort;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.OcrParagraph;
import com.toonlira.translationgateway.domain.ocr.MosaicLayout;
import com.toonlira.translationgateway.domain.ocr.OcrReread;
import com.toonlira.translationgateway.domain.layout.LayoutBox;
import com.toonlira.translationgateway.domain.layout.TextBox;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

/**
 * Re-reads the page's doubtful paragraphs (low provider confidence or non-words of the source language) from
 * several image variants packed into one mosaic, so a page with doubts costs one extra OCR call, and keeps the
 * reading the vote prefers. Best effort: any failure keeps the provider's original reading.
 */
@Service
public class OcrRereadService {
    private static final org.slf4j.Logger LOG = org.slf4j.LoggerFactory.getLogger(OcrRereadService.class);
    /** Pixels of context around a paragraph box: lettering slightly outside the provider's box. */
    static final int CROP_MARGIN = 6;
    /** Words spanning less of a detector text box's long side than this leave part of its lettering unread. */
    static final double PARTIAL_COVERAGE = .6;
    /** Scripts written without spaces: provider line breaks inside a recovered reading are dropped, not spaced. */
    private static final java.util.Set<String> UNSPACED = java.util.Set.of("ja", "zh-Hans", "zh-Hant");
    private final OcrPort ocr;
    private final RereadImagingPort imaging;
    private final LexiconPort lexicons;
    private final GatewayProperties properties;

    public OcrRereadService(OcrPort ocr, RereadImagingPort imaging, LexiconPort lexicons, GatewayProperties properties) {
        this.ocr = ocr;
        this.imaging = imaging;
        this.lexicons = lexicons;
        this.properties = properties;
    }

    public boolean enabled() { return properties.getOcr().getRereadMaxRegions() > 0; }

    /**
     * Re-reads grouped speeches. Each region gets the provider words whose centre lies in its box (with their
     * confidences), so doubt is judged on the whole speech and the crop carries the whole context.
     */
    public List<OcrManifest.Region> improveRegions(List<OcrManifest.Region> regions, List<OcrParagraph> read, Path image,
                                                   String sourceLanguage, int widthPx, int heightPx) {
        if (!enabled() || regions.isEmpty()) return regions;
        var words = read.stream().flatMap(paragraph -> paragraph.words().stream()).toList();
        var boxes = regions.stream().map(region -> crop(region, widthPx, heightPx, 0)).toList();
        var crops = regions.stream().map(region -> crop(region, widthPx, heightPx, CROP_MARGIN)).toList();
        // A word belongs to the smallest region box holding its centre: a dialog box drawn around a neighbour's lines
        // (lettering behind an "ERROR!" effect split in two regions) does not own them.
        var owners = new int[words.size()];
        var centres = new double[words.size()][];
        for (int w = 0; w < words.size(); w++) {
            centres[w] = centre(words.get(w), widthPx, heightPx);
            owners[w] = -1;
            double smallest = Double.MAX_VALUE;
            for (int r = 0; r < boxes.size(); r++) {
                var box = boxes.get(r);
                double area = (double) (box[2] - box[0]) * (box[3] - box[1]);
                if (inside(box, centres[w]) && area < smallest) { smallest = area; owners[w] = r; }
            }
        }
        var units = new ArrayList<OcrParagraph>(regions.size());
        for (int r = 0; r < regions.size(); r++) {
            var mine = new ArrayList<OcrParagraph.Word>();
            boolean crowded = false;
            for (int w = 0; w < words.size(); w++) {
                if (inside(boxes.get(r), centres[w])) mine.add(words.get(w));
                if (owners[w] >= 0 && owners[w] != r && inside(crops.get(r), centres[w])) crowded = true;
            }
            // The crop of a region holding another region's words would read that text into this one (the same
            // sentence then reaches the page twice): such a region keeps the provider's reading.
            units.add(new OcrParagraph(regions.get(r), crowded ? List.of() : mine));
        }
        return improve(units, image, sourceLanguage, widthPx, heightPx).stream().map(OcrParagraph::region).toList();
    }

    private static double[] centre(OcrParagraph.Word word, int widthPx, int heightPx) {
        double cx = 0, cy = 0;
        for (var vertex : word.polygon()) { cx += vertex.x() / word.polygon().size(); cy += vertex.y() / word.polygon().size(); }
        return new double[]{cx * widthPx, cy * heightPx};
    }

    private static boolean inside(int[] box, double[] point) {
        return point[0] >= box[0] && point[0] <= box[2] && point[1] >= box[1] && point[1] <= box[3];
    }

    public List<OcrParagraph> improve(List<OcrParagraph> paragraphs, Path image, String sourceLanguage,
                                      int widthPx, int heightPx) {
        if (!enabled() || paragraphs.isEmpty()) return paragraphs;
        try {
            var lexicon = lexicons.forLanguage(sourceLanguage);
            var suspects = OcrReread.suspects(paragraphs, lexicon, properties.getOcr().getRereadMaxRegions());
            if (suspects.isEmpty()) return paragraphs;
            var crops = suspects.stream().map(index -> crop(paragraphs.get(index).region(), widthPx, heightPx, CROP_MARGIN)).toList();
            var mosaic = imaging.build(image, crops);
            if (mosaic == null) return paragraphs;
            var read = ocr.recognizeImage(mosaic.png(), sourceLanguage, mosaic.layout().width(), mosaic.layout().height());
            var boxes = suspects.stream().map(index -> crop(paragraphs.get(index).region(), widthPx, heightPx, 0)).toList();
            var readings = readingsPerTile(read, mosaic.layout(), crops, boxes);
            var result = new ArrayList<>(paragraphs);
            int replaced = 0;
            for (int s = 0; s < suspects.size(); s++) {
                var original = paragraphs.get(suspects.get(s));
                var rereads = new ArrayList<OcrReread.Reading>();
                for (int v = 0; v < RereadImagingPort.VARIANTS; v++) {
                    var reading = readings.get(s * RereadImagingPort.VARIANTS + v);
                    if (reading != null) rereads.add(reading);
                }
                var chosen = OcrReread.choose(new OcrReread.Reading(original.region().sourceText(), mean(original.words())),
                    rereads, lexicon);
                if (chosen.equals(original.region().sourceText())) continue;
                replaced++;
                var region = original.region();
                // Word geometry no longer matches the new text, so the paragraph is not split by balloon later.
                result.set(suspects.get(s), new OcrParagraph(
                    new OcrManifest.Region(region.id(), region.readingOrder(), chosen, region.polygon()), List.of()));
            }
            // Counts only: OCR text never reaches logs.
            LOG.info("OCR re-read: paragraphs={} suspects={} tilesRead={} replaced={}", paragraphs.size(), suspects.size(),
                readings.stream().filter(java.util.Objects::nonNull).count(), replaced);
            return List.copyOf(result);
        } catch (RuntimeException | LinkageError unavailable) {
            LOG.info("OCR re-read skipped: {}", unavailable.getClass().getSimpleName());
            return paragraphs;
        }
    }

    /**
     * Recovers text the provider did not read, or read only in part: detector text boxes with no provider word
     * inside, or whose words cover less than {@link #PARTIAL_COVERAGE} of the box's long side (a column of a
     * multi-column balloon left out: 「うん……」 of 「うん……でも」), are read from the same image variants (one extra
     * OCR call per page that has such boxes, at most the re-read budget of boxes, unread boxes first).
     *
     * <p>The crop is the detector box itself, laid on a white frame: measured on real pages, a margin of page brings
     * in the balloon border, which the provider reads as "0000" or "ll", while white space around the exact box
     * lets it read short and vertical lettering in order (「あーでも」 instead of 「であも」). An unread box becomes a
     * new paragraph when the variants agree ({@link OcrReread#recover}); a partly read one replaces its paragraphs
     * only with a longer agreed reading that contains them ({@link OcrReread#extend}). Otherwise the page stays as
     * the provider read it.
     */
    public List<OcrParagraph> recover(List<OcrParagraph> read, List<TextBox> texts, Path image, String sourceLanguage,
                                      UUID jobRef, int widthPx, int heightPx) {
        if (!enabled() || texts == null || texts.isEmpty()) return read;
        try {
            record Candidate(TextBox box, int[] crop, List<Integer> paragraphs) { }
            var unread = new ArrayList<Candidate>();
            var partial = new ArrayList<Candidate>();
            var ordered = texts.stream().sorted(Comparator.comparingDouble(TextBox::confidence).reversed()).toList();
            for (var text : ordered) {
                var crop = pixels(text.bounds(), widthPx, heightPx);
                if (crop[2] - crop[0] < 2 || crop[3] - crop[1] < 2) continue;
                var inside = paragraphsInside(read, crop, widthPx, heightPx);
                if (inside == null) continue; // a paragraph only partly inside: not this box's text alone
                if (inside.isEmpty()) unread.add(new Candidate(text, crop, List.of()));
                else if (coverage(read, inside, crop, widthPx, heightPx) < PARTIAL_COVERAGE) partial.add(new Candidate(text, crop, inside));
            }
            var candidates = new ArrayList<Candidate>(unread);
            candidates.addAll(partial);
            // Two boxes of one balloon must not both rewrite the same paragraphs.
            var claimed = new java.util.HashSet<Integer>();
            candidates.removeIf(candidate -> candidate.paragraphs().stream().anyMatch(index -> !claimed.add(index)));
            if (candidates.size() > properties.getOcr().getRereadMaxRegions())
                candidates.subList(properties.getOcr().getRereadMaxRegions(), candidates.size()).clear();
            if (candidates.isEmpty()) return read;
            var crops = candidates.stream().map(Candidate::crop).toList();
            var mosaic = imaging.build(image, crops, true);
            if (mosaic == null) return read;
            var mosaicRead = ocr.recognizeImage(mosaic.png(), sourceLanguage, mosaic.layout().width(), mosaic.layout().height());
            // Tiles hold the framed crop: map words back through the frame-sized rectangle around each box.
            var framed = crops.stream().map(crop -> {
                int pad = RereadImagingPort.framePad(crop);
                return new int[]{crop[0] - pad, crop[1] - pad, crop[2] + pad, crop[3] + pad};
            }).toList();
            var readings = readingsPerTile(mosaicRead, mosaic.layout(), framed, crops);
            var crossed = acrossColumns(mosaicRead, mosaic.layout(), crops);
            var result = new ArrayList<OcrParagraph>(read);
            var removed = new java.util.HashSet<Integer>();
            boolean joinWithoutSpaces = UNSPACED.contains(sourceLanguage);
            int added = 0, extended = 0;
            for (int c = 0; c < candidates.size(); c++) {
                var candidate = candidates.get(c);
                var variants = new ArrayList<OcrReread.Reading>();
                for (int v = 0; v < RereadImagingPort.VARIANTS; v++) {
                    int tile = c * RereadImagingPort.VARIANTS + v;
                    if (readings.get(tile) != null && !crossed[tile]) variants.add(readings.get(tile));
                }
                var existing = candidate.paragraphs().stream().map(index -> read.get(index).region().sourceText()).toList();
                var chosen = existing.isEmpty() ? OcrReread.recover(variants) : OcrReread.extend(variants, existing);
                if (chosen == null) continue;
                var text = chosen.text().strip().replaceAll("\\s+", joinWithoutSpaces ? "" : " ");
                var box = candidate.box().bounds();
                var polygon = List.of(new OcrManifest.Vertex(box.left(), box.top()), new OcrManifest.Vertex(box.right(), box.top()),
                    new OcrManifest.Vertex(box.right(), box.bottom()), new OcrManifest.Vertex(box.left(), box.bottom()));
                // Stable opaque id: the replaced paragraph's, or one from the job and the detector box.
                var id = existing.isEmpty()
                    ? UUID.nameUUIDFromBytes((jobRef + ":recovered:" + candidate.box().id()).getBytes(StandardCharsets.UTF_8))
                    : read.get(candidate.paragraphs().getFirst()).region().id();
                var paragraph = new OcrParagraph(new OcrManifest.Region(id, 0, text, polygon),
                    List.of(new OcrParagraph.Word(text, polygon, chosen.confidence())));
                if (existing.isEmpty()) { result.add(paragraph); added++; }
                else {
                    result.set(candidate.paragraphs().getFirst(), paragraph);
                    removed.addAll(candidate.paragraphs().subList(1, candidate.paragraphs().size()));
                    extended++;
                }
            }
            var kept = new ArrayList<OcrParagraph>(result.size());
            for (int i = 0; i < result.size(); i++) {
                if (removed.contains(i)) continue;
                var region = result.get(i).region();
                if (region.readingOrder() == kept.size()) { kept.add(result.get(i)); continue; }
                kept.add(new OcrParagraph(new OcrManifest.Region(region.id(), kept.size(), region.sourceText(), region.polygon()),
                    result.get(i).words()));
            }
            // Counts only: OCR text never reaches logs.
            LOG.info("OCR recovery: unreadBoxes={} partialBoxes={} recovered={} extended={}", unread.size(), partial.size(), added, extended);
            return List.copyOf(kept);
        } catch (RuntimeException | LinkageError unavailable) {
            LOG.info("OCR recovery skipped: {}", unavailable.getClass().getSimpleName());
            return read;
        }
    }

    /**
     * Indexes of the paragraphs with words in the crop (word centre inside), or null when one of them also has
     * words outside it.
     */
    private static List<Integer> paragraphsInside(List<OcrParagraph> read, int[] crop, int widthPx, int heightPx) {
        var inside = new ArrayList<Integer>();
        for (int p = 0; p < read.size(); p++) {
            int in = 0, out = 0;
            for (var word : read.get(p).words()) {
                double cx = 0, cy = 0;
                for (var vertex : word.polygon()) { cx += vertex.x() / word.polygon().size(); cy += vertex.y() / word.polygon().size(); }
                if (cx * widthPx >= crop[0] && cx * widthPx <= crop[2] && cy * heightPx >= crop[1] && cy * heightPx <= crop[3]) in++;
                else out++;
            }
            if (in > 0 && out > 0) return null;
            if (in > 0) inside.add(p);
        }
        return inside;
    }

    /** Share of the crop's long side spanned by the words of those paragraphs. */
    private static double coverage(List<OcrParagraph> read, List<Integer> paragraphs, int[] crop, int widthPx, int heightPx) {
        boolean vertical = crop[3] - crop[1] >= crop[2] - crop[0];
        double low = Double.MAX_VALUE, high = -Double.MAX_VALUE;
        for (int index : paragraphs) {
            for (var word : read.get(index).words()) {
                for (var vertex : word.polygon()) {
                    double value = vertical ? vertex.y() * heightPx : vertex.x() * widthPx;
                    low = Math.min(low, value); high = Math.max(high, value);
                }
            }
        }
        double side = vertical ? crop[3] - crop[1] : crop[2] - crop[0];
        return high < low ? 0 : Math.min(1, (high - low) / side);
    }

    /**
     * Tiles where the provider read across vertical columns: in a crop taller than wide (vertical lettering), a word
     * of several letters laid out wider than tall joins characters of neighbouring columns ("であ" for 「あー」「でも」).
     */
    static boolean[] acrossColumns(List<OcrParagraph> read, MosaicLayout.Layout layout, List<int[]> crops) {
        var crossed = new boolean[layout.tiles().size()];
        for (var paragraph : read) {
            for (var word : paragraph.words()) {
                if (word.text().codePoints().filter(Character::isLetterOrDigit).count() < 2) continue;
                double left = 1, top = 1, right = 0, bottom = 0;
                for (var vertex : word.polygon()) {
                    left = Math.min(left, vertex.x()); right = Math.max(right, vertex.x());
                    top = Math.min(top, vertex.y()); bottom = Math.max(bottom, vertex.y());
                }
                double x0 = left * layout.width(), y0 = top * layout.height(), x1 = right * layout.width(), y1 = bottom * layout.height();
                int tile = MosaicLayout.tileOf(layout, x0, y0, x1, y1);
                if (tile < 0) continue;
                var crop = crops.get(tile / RereadImagingPort.VARIANTS);
                boolean vertical = crop[3] - crop[1] > crop[2] - crop[0];
                if (vertical && x1 - x0 > y1 - y0) crossed[tile] = true;
            }
        }
        return crossed;
    }

    private static int[] pixels(LayoutBox box, int widthPx, int heightPx) {
        return new int[]{Math.max(0, (int) Math.floor(box.left() * widthPx)), Math.max(0, (int) Math.floor(box.top() * heightPx)),
            Math.min(widthPx, (int) Math.ceil(box.right() * widthPx)), Math.min(heightPx, (int) Math.ceil(box.bottom() * heightPx))};
    }

    /**
     * Words of the mosaic grouped by the tile their centre falls in, in provider order. A word is kept only when its
     * centre, mapped back to the page, lies inside the paragraph's own box: the crop margin exists so strokes are
     * not cut, not to read the neighbouring line. Words keep the provider's own breaks ("SAYING, WHY" stays glued);
     * only separate provider paragraphs of one tile are joined with a space.
     */
    static List<OcrReread.Reading> readingsPerTile(List<OcrParagraph> read, MosaicLayout.Layout layout,
                                                   List<int[]> crops, List<int[]> boxes) {
        int tiles = layout.tiles().size();
        var texts = new ArrayList<StringBuilder>(tiles);
        var confidences = new double[tiles];
        var counts = new int[tiles];
        var lastParagraph = new int[tiles];
        java.util.Arrays.fill(lastParagraph, -1);
        for (int i = 0; i < tiles; i++) texts.add(new StringBuilder());
        for (int p = 0; p < read.size(); p++) {
            for (var word : read.get(p).words()) {
                double left = 1, top = 1, right = 0, bottom = 0;
                for (var vertex : word.polygon()) {
                    left = Math.min(left, vertex.x()); right = Math.max(right, vertex.x());
                    top = Math.min(top, vertex.y()); bottom = Math.max(bottom, vertex.y());
                }
                double x0 = left * layout.width(), y0 = top * layout.height(), x1 = right * layout.width(), y1 = bottom * layout.height();
                int tile = MosaicLayout.tileOf(layout, x0, y0, x1, y1);
                if (tile < 0 || MosaicLayout.spansTiles(layout, x0, y0, x1, y1) || !insideOwnBox(layout.tiles().get(tile), crops.get(tile / RereadImagingPort.VARIANTS),
                    boxes.get(tile / RereadImagingPort.VARIANTS), (x0 + x1) / 2, (y0 + y1) / 2)) continue;
                var text = texts.get(tile);
                if (lastParagraph[tile] >= 0 && lastParagraph[tile] != p && !text.isEmpty()
                    && !Character.isWhitespace(text.charAt(text.length() - 1))) text.append(' ');
                lastParagraph[tile] = p;
                text.append(word.text());
                if (!Double.isNaN(word.confidence())) { confidences[tile] += word.confidence(); counts[tile]++; }
            }
        }
        var readings = new ArrayList<OcrReread.Reading>(tiles);
        for (int i = 0; i < tiles; i++) {
            var text = texts.get(i).toString().strip();
            readings.add(text.isEmpty() ? null : new OcrReread.Reading(text, counts[i] == 0 ? Double.NaN : confidences[i] / counts[i]));
        }
        return readings;
    }

    /** Maps a mosaic point back to the page through the tile's scale and checks it against the paragraph box. */
    static boolean insideOwnBox(MosaicLayout.Tile tile, int[] crop, int[] box, double x, double y) {
        double scaleX = (double) tile.width() / Math.max(1, crop[2] - crop[0]);
        double scaleY = (double) tile.height() / Math.max(1, crop[3] - crop[1]);
        double pageX = crop[0] + (x - tile.x()) / scaleX, pageY = crop[1] + (y - tile.y()) / scaleY;
        return pageX >= box[0] && pageX <= box[2] && pageY >= box[1] && pageY <= box[3];
    }

    static int[] crop(OcrManifest.Region region, int widthPx, int heightPx, int margin) {
        double left = 1, top = 1, right = 0, bottom = 0;
        for (var vertex : region.polygon()) {
            left = Math.min(left, vertex.x()); right = Math.max(right, vertex.x());
            top = Math.min(top, vertex.y()); bottom = Math.max(bottom, vertex.y());
        }
        // Clamped like the imaging side clamps, so tile scale and page mapping agree at the page edges.
        return new int[]{Math.max(0, (int) Math.floor(left * widthPx) - margin), Math.max(0, (int) Math.floor(top * heightPx) - margin),
            Math.min(widthPx, (int) Math.ceil(right * widthPx) + margin), Math.min(heightPx, (int) Math.ceil(bottom * heightPx) + margin)};
    }

    private static double mean(List<OcrParagraph.Word> words) {
        double sum = 0;
        int count = 0;
        for (var word : words) if (!Double.isNaN(word.confidence())) { sum += word.confidence(); count++; }
        return count == 0 ? Double.NaN : sum / count;
    }
}
