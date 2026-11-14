package com.toonlira.translationgateway.application;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.LexiconPort;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.application.port.RereadImagingPort;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.OcrParagraph;
import com.toonlira.translationgateway.domain.ocr.MosaicLayout;
import com.toonlira.translationgateway.domain.ocr.OcrReread;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
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
        var units = new ArrayList<OcrParagraph>(regions.size());
        for (var region : regions) {
            var box = crop(region, widthPx, heightPx, 0);
            var mine = new ArrayList<OcrParagraph.Word>();
            for (var word : words) {
                double cx = 0, cy = 0;
                for (var vertex : word.polygon()) { cx += vertex.x() / word.polygon().size(); cy += vertex.y() / word.polygon().size(); }
                if (cx * widthPx >= box[0] && cx * widthPx <= box[2] && cy * heightPx >= box[1] && cy * heightPx <= box[3]) mine.add(word);
            }
            units.add(new OcrParagraph(region, mine));
        }
        return improve(units, image, sourceLanguage, widthPx, heightPx).stream().map(OcrParagraph::region).toList();
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
                if (tile < 0 || !insideOwnBox(layout.tiles().get(tile), crops.get(tile / RereadImagingPort.VARIANTS),
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
