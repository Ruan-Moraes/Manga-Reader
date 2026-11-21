package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Per-region visual checks shared by the synthetic and the real-page regression. */
final class RegionChecks {
    /** Luminance below which a pixel is lettering ink. */
    static final int INK = 110;
    private static final int SLACK = 3;

    private RegionChecks() { }

    /** One translated region: id {@code new UUID(0, index + 1)}. */
    record Text(String source, String translation, List<OcrManifest.Vertex> polygon) { }

    static RenderRequest request(BufferedImage image, String sourceLanguage, List<Text> texts) {
        var job = new UUID(0, 777);
        var pair = new LanguagePair(sourceLanguage, "pt-BR");
        var regions = new ArrayList<OcrManifest.Region>();
        for (int i = 0; i < texts.size(); i++) regions.add(new OcrManifest.Region(new UUID(0, i + 1), i, texts.get(i).source(), texts.get(i).polygon()));
        var ocr = new OcrManifest("1.0", job, sourceLanguage, image.getWidth(), image.getHeight(), regions);
        var input = new TranslationRequest(job, pair, regions.stream().map(r -> new TranslationRequest.Region(r.id(), r.readingOrder(), r.sourceText())).toList());
        var output = new TranslationResponse(java.util.stream.IntStream.range(0, texts.size())
            .mapToObj(i -> new TranslationResponse.Region(regions.get(i).id(), texts.get(i).translation())).toList());
        var translated = new TranslationValidator(Set.of(pair)).validateResponse(input, output);
        return RenderRequest.create(new RenderSource("image/png", 100, image.getWidth(), image.getHeight(), "a".repeat(64)),
            ocr, translated, "b".repeat(64), "c".repeat(64), RenderPolicy.initial());
    }

    /** Pixels changed outside every allowed rectangle (balloons, text boxes): art must stay untouched. */
    static int changedOutside(BufferedImage before, BufferedImage after, List<Rectangle> allowed) {
        int changed = 0;
        for (int y = 0; y < before.getHeight(); y++) for (int x = 0; x < before.getWidth(); x++) {
            if (before.getRGB(x, y) == after.getRGB(x, y)) continue;
            boolean ok = false;
            for (var box : allowed) if (box.contains(x, y)) { ok = true; break; }
            if (!ok) changed++;
        }
        return changed;
    }

    /** Bounding box of the pixels changed outside the allowed rectangles (diagnostics), or null. */
    static Rectangle changedOutsideBounds(BufferedImage before, BufferedImage after, List<Rectangle> allowed) {
        Rectangle result = null;
        for (int y = 0; y < before.getHeight(); y++) for (int x = 0; x < before.getWidth(); x++) {
            if (before.getRGB(x, y) == after.getRGB(x, y)) continue;
            boolean ok = false;
            for (var box : allowed) if (box.contains(x, y)) { ok = true; break; }
            if (ok) continue;
            if (result == null) result = new Rectangle(x, y, 1, 1); else result.add(x, y);
        }
        return result;
    }

    /**
     * Source ink left behind in a translated region: pixels that were ink before, still are, and lie outside the box
     * of the new lettering (pixels that became ink). Leftover glyphs beside the new text (「がま」) are counted; the
     * new text itself, drawn over the old position, is not.
     */
    static int residualInk(BufferedImage before, BufferedImage after, Rectangle region) {
        int minX = Integer.MAX_VALUE, minY = Integer.MAX_VALUE, maxX = -1, maxY = -1;
        var area = region.intersection(new Rectangle(0, 0, before.getWidth(), before.getHeight()));
        for (int y = area.y; y < area.y + area.height; y++) for (int x = area.x; x < area.x + area.width; x++) {
            if (ink(after.getRGB(x, y)) && !ink(before.getRGB(x, y))) {
                minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
            }
        }
        int residual = 0;
        for (int y = area.y; y < area.y + area.height; y++) for (int x = area.x; x < area.x + area.width; x++) {
            // A few pixels of slack: new strokes that land exactly on old ones were ink already and do not mark the box.
            boolean insideNewText = maxX >= 0 && x >= minX - SLACK && x <= maxX + SLACK && y >= minY - SLACK && y <= maxY + SLACK;
            if (!insideNewText && ink(before.getRGB(x, y)) && ink(after.getRGB(x, y))) residual++;
        }
        return residual;
    }

    static boolean identical(BufferedImage a, BufferedImage b, Rectangle area) {
        for (int y = area.y; y < area.y + area.height; y++) for (int x = area.x; x < area.x + area.width; x++)
            if (a.getRGB(x, y) != b.getRGB(x, y)) return false;
        return true;
    }

    static Rectangle bounds(List<OcrManifest.Vertex> polygon, int width, int height) {
        double l = 1, t = 1, r = 0, b = 0;
        for (var v : polygon) { l = Math.min(l, v.x()); r = Math.max(r, v.x()); t = Math.min(t, v.y()); b = Math.max(b, v.y()); }
        return new Rectangle((int) Math.floor(l * width), (int) Math.floor(t * height),
            (int) Math.ceil((r - l) * width) + 1, (int) Math.ceil((b - t) * height) + 1);
    }

    static boolean ink(int argb) {
        return (((argb >> 16) & 255) * 3 + ((argb >> 8) & 255) * 6 + (argb & 255)) / 10 < INK;
    }

    static BufferedImage copy(BufferedImage original) {
        // Any decoded type (3-byte BGR JPEG, gray PNG) becomes the painter's ARGB raster.
        var image = new BufferedImage(original.getWidth(), original.getHeight(), BufferedImage.TYPE_INT_ARGB);
        var graphics = image.createGraphics();
        try { graphics.drawImage(original, 0, 0, null); } finally { graphics.dispose(); }
        return image;
    }

    static void outline(BufferedImage image, int left, int top, int right, int bottom) {
        for (int x = left; x <= right; x++) { image.setRGB(x, top, 0xff000000); image.setRGB(x, bottom, 0xff000000); }
        for (int y = top; y <= bottom; y++) { image.setRGB(left, y, 0xff000000); image.setRGB(right, y, 0xff000000); }
    }

    static void bars(BufferedImage image, int left, int top, int right, int bottom) {
        for (int x = left; x < right; x += 8) for (int y = top; y < bottom; y++) for (int dx = 0; dx < 3 && x + dx < right; dx++)
            image.setRGB(x + dx, y, 0xff000000);
    }

    /** Per-channel median of the one-pixel ring just outside {@code box} ({left, top, right, bottom}), clipped to the image. */
    static int ringMedian(java.awt.image.BufferedImage image, int[] box) {
        var samples = new java.util.ArrayList<Integer>();
        int l = box[0] - 1, t = box[1] - 1, r = box[2], b = box[3];
        for (int x = l; x <= r; x++) { sample(image, x, t, samples); sample(image, x, b, samples); }
        for (int y = t + 1; y < b; y++) { sample(image, l, y, samples); sample(image, r, y, samples); }
        if (samples.isEmpty()) return 0xffffffff;
        int colour = 0xff000000;
        for (int shift : new int[]{16, 8, 0}) {
            int[] channel = samples.stream().mapToInt(c -> (c >>> shift) & 255).sorted().toArray();
            colour |= channel[channel.length / 2] << shift;
        }
        return colour;
    }

    private static void sample(java.awt.image.BufferedImage image, int x, int y, java.util.List<Integer> samples) {
        if (x >= 0 && y >= 0 && x < image.getWidth() && y < image.getHeight()) samples.add(image.getRGB(x, y));
    }
}
