package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderPaintingException.Failure.CANCELLED;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderPaintingException.Failure.INVALID_INPUT;

import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import java.awt.image.BufferedImage;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/** Mutates only the caller's decoded working raster, never an original file or a second full-page raster. */
final class CleanBoxPainter {
    private static final int SAMPLES_PER_SIDE = 32;
    private static final int MAX_SAMPLES = 4 * SAMPLES_PER_SIDE;
    static final int INK_DISTANCE = 120;
    static final int BACKGROUND_DISTANCE = 30;
    /** JPEG block noise around the source glyphs reaches up to one 8x8 block past the OCR polygon. */
    static final int HALO_PX = 8;
    /** Halo pixels this close to ink that stays (balloon border, artwork) are kept: they are its antialiasing. */
    private static final int HALO_GUARD_PX = 2;
    /** Faint JPEG ringing (about 2 levels per channel and up) still reads as a line next to a perfectly flat fill. */
    private static final int HALO_MIN_DISTANCE = 6;
    /** Above this share of non-flat pixels the band is screentone or gradient, not sparse compression noise. */
    private static final double MAX_HALO_DENSITY = .4;
    private static final int NO_SURROUNDING_COLOR = 0xffffffff;

    List<CleanRegion> clean(BufferedImage image, RenderRequest request) {
        var prepared = prepare(image, request);
        var row = new int[image.getWidth()];
        for (var region : prepared) fill(image, region, row);
        return prepared;
    }

    List<CleanRegion> prepare(BufferedImage image, RenderRequest request) {
        validate(image, request);
        checkInterrupted();
        var polygons = request.regions().stream().map(region ->
            new RasterPolygon(region.polygon(), image.getWidth(), image.getHeight())).toList();
        var prepared = new ArrayList<CleanRegion>(polygons.size());
        for (int i = 0; i < polygons.size(); i++) {
            checkInterrupted();
            int padding = Math.max(1, request.policy().paddingPx());
            int argb = surroundingColor(image, polygons.get(i), polygons, padding);
            var others = new ArrayList<>(polygons);
            others.remove(i);
            // Without any surrounding sample (region covered by others or by the page edge) there is no balloon
            // reference colour: the whole polygon is cleaned, as the plain clean-box policy does.
            var limit = balloonLimit(request, request.regions().get(i), image.getWidth(), image.getHeight());
            var mask = hasSurroundings(image, polygons.get(i), polygons, padding)
                ? BalloonMask.of(image, polygons.get(i), others, argb, limit) : BalloonMask.polygonOnly(polygons.get(i));
            prepared.add(new CleanRegion(request.regions().get(i), polygons.get(i), argb, mask, limit));
        }
        // All surroundings refer to the same untouched raster; earlier paint cannot influence later color estimates.
        return List.copyOf(prepared);
    }

    void fill(BufferedImage image, CleanRegion region, int[] row) {
        Arrays.fill(row, region.argb());
        for (int y = region.polygon().bounds().top(); y < region.polygon().bounds().bottom(); y++) {
            checkInterrupted();
            var span = region.polygon().span(y);
            if (span != null) image.setRGB(span.start(), y, span.end() - span.start(), 1, row, 0, row.length);
        }
    }

    /**
     * Balloon-mask cleaning: only the balloon interior inside the polygon and the source glyphs it encloses are
     * erased (see {@link BalloonMask}); polygon pixels over borders or artwork stay. {@code halo} comes from
     * {@link #halo}, computed beforehand on the untouched raster.
     */
    void fillMasked(BufferedImage image, CleanRegion region, List<Integer> halo) {
        region.mask().fill(image, region.argb());
        for (int index : halo) image.setRGB(index % image.getWidth(), index / image.getWidth(), region.argb());
    }

    /**
     * Sparse non-ink noise (JPEG ringing) in the balloon within HALO_PX of the polygon, which a flat fill leaves as a
     * faint rectangle around the new text. Only balloon-interior pixels qualify; those near remaining ink
     * (antialiasing of borders/art) are kept, and the band is skipped when dense (screentone or gradient). Must be
     * computed before any painting; {@code reserved} boxes (where other regions draw) are never touched.
     */
    static List<Integer> halo(BufferedImage image, CleanRegion region, List<RasterPolygon.Bounds> reserved) {
        var bounds = region.polygon().bounds();
        var mask = region.mask();
        int reach = HALO_PX + HALO_GUARD_PX;
        int left = Math.max(0, bounds.left() - reach), right = Math.min(image.getWidth(), bounds.right() + reach);
        int top = Math.max(0, bounds.top() - reach), bottom = Math.min(image.getHeight(), bounds.bottom() + reach);
        int width = right - left, height = bottom - top;
        if (width <= 0 || height <= 0) return List.of();
        var distance = new int[width * height];
        var foreign = new boolean[width * height];
        for (int y = top; y < bottom; y++) {
            checkInterrupted();
            for (int x = left; x < right; x++) {
                int i = (y - top) * width + (x - left);
                distance[i] = distance(image.getRGB(x, y), region.argb());
                foreign[i] = distance[i] > INK_DISTANCE && !mask.clean(x, y);
            }
        }
        int band = 0, noisy = 0;
        var candidates = new ArrayList<Integer>();
        for (int y = Math.max(0, bounds.top() - HALO_PX); y < Math.min(image.getHeight(), bounds.bottom() + HALO_PX); y++) {
            checkInterrupted();
            for (int x = Math.max(0, bounds.left() - HALO_PX); x < Math.min(image.getWidth(), bounds.right() + HALO_PX); x++) {
                if (mask.clean(x, y)) continue;
                int i = (y - top) * width + (x - left);
                band++;
                if (distance[i] < HALO_MIN_DISTANCE || distance[i] > INK_DISTANCE) continue;
                noisy++;
                if (!(mask.allowed(x, y) || mask.enclosedSpeck(x, y)) || nearForeign(foreign, width, height, x - left, y - top) || inside(reserved, x, y)) continue;
                candidates.add(y * image.getWidth() + x);
            }
        }
        return band == 0 || noisy > band * MAX_HALO_DENSITY ? List.of() : candidates;
    }

    private static boolean nearForeign(boolean[] foreign, int width, int height, int x, int y) {
        for (int dy = -HALO_GUARD_PX; dy <= HALO_GUARD_PX; dy++) for (int dx = -HALO_GUARD_PX; dx <= HALO_GUARD_PX; dx++) {
            int nx = x + dx, ny = y + dy;
            if (nx >= 0 && ny >= 0 && nx < width && ny < height && foreign[ny * width + nx]) return true;
        }
        return false;
    }

    private static boolean inside(List<RasterPolygon.Bounds> boxes, int x, int y) {
        for (var box : boxes) if (x >= box.left() && x < box.right() && y >= box.top() && y < box.bottom()) return true;
        return false;
    }

    static int distance(int a, int b) {
        return Math.abs(((a >>> 16) & 255) - ((b >>> 16) & 255)) + Math.abs(((a >>> 8) & 255) - ((b >>> 8) & 255))
            + Math.abs((a & 255) - (b & 255));
    }

    private static int surroundingColor(BufferedImage image, RasterPolygon polygon, List<RasterPolygon> all, int padding) {
        var bounds = polygon.bounds();
        int left = bounds.left() - padding, right = bounds.right() - 1 + padding;
        int top = bounds.top() - padding, bottom = bounds.bottom() - 1 + padding;
        var samples = new int[MAX_SAMPLES];
        int count = 0;
        for (int i = 0; i < SAMPLES_PER_SIDE; i++) {
            int x = interpolate(left, right, i), y = interpolate(top, bottom, i);
            count = sample(image, x, top, all, samples, count);
            count = sample(image, x, bottom, all, samples, count);
            count = sample(image, left, y, all, samples, count);
            count = sample(image, right, y, all, samples, count);
        }
        if (count == 0) return NO_SURROUNDING_COLOR;
        int color = 0;
        var channel = new int[count];
        for (int shift : new int[]{24, 16, 8, 0}) {
            for (int i = 0; i < count; i++) channel[i] = (samples[i] >>> shift) & 0xff;
            Arrays.sort(channel);
            color |= channel[(count - 1) / 2] << shift;
        }
        return color;
    }

    /** Detector boxes are loose: a region's balloon may extend this share of the box beyond each side. */
    static final double BALLOON_SLACK = .15;
    /** Share of the OCR polygon that must lie in a detected balloon for that balloon to bound it. */
    static final double BALLOON_CONTAINMENT = .9;

    /**
     * Bounds of the smallest detected balloon containing the region, widened by {@link #BALLOON_SLACK}; null when
     * no balloon (or no layout) contains it. Caps where the balloon interior may extend: a flat area that leaks
     * through a gap in the balloon border stops here.
     */
    static RasterPolygon.Bounds balloonLimit(RenderRequest request, RenderRequest.Region region, int width, int height) {
        com.toonlira.translationgateway.domain.layout.LayoutBox best = null;
        for (var bubble : request.bubbles()) {
            double containment;
            try { containment = com.toonlira.translationgateway.domain.layout.LayoutGeometry.containment(region.polygon(), bubble); }
            catch (RuntimeException invalid) { continue; }
            if (containment < BALLOON_CONTAINMENT) continue;
            if (best == null || area(bubble) < area(best)) best = bubble;
        }
        if (best == null) return null;
        double dx = (best.right() - best.left()) * BALLOON_SLACK, dy = (best.bottom() - best.top()) * BALLOON_SLACK;
        return new RasterPolygon.Bounds((int) Math.floor(Math.max(0, best.left() - dx) * width),
            (int) Math.floor(Math.max(0, best.top() - dy) * height),
            (int) Math.ceil(Math.min(1, best.right() + dx) * width), (int) Math.ceil(Math.min(1, best.bottom() + dy) * height));
    }

    private static double area(com.toonlira.translationgateway.domain.layout.LayoutBox box) {
        return (box.right() - box.left()) * (box.bottom() - box.top());
    }

    private static boolean hasSurroundings(BufferedImage image, RasterPolygon polygon, List<RasterPolygon> all, int padding) {
        var bounds = polygon.bounds();
        int left = bounds.left() - padding, right = bounds.right() - 1 + padding;
        int top = bounds.top() - padding, bottom = bounds.bottom() - 1 + padding;
        var samples = new int[MAX_SAMPLES];
        int count = 0;
        for (int i = 0; i < SAMPLES_PER_SIDE && count == 0; i++) {
            int x = interpolate(left, right, i), y = interpolate(top, bottom, i);
            count = sample(image, x, top, all, samples, count);
            count = sample(image, x, bottom, all, samples, count);
            count = sample(image, left, y, all, samples, count);
            count = sample(image, right, y, all, samples, count);
        }
        return count > 0;
    }

    private static int sample(BufferedImage image, int x, int y, List<RasterPolygon> all, int[] samples, int count) {
        if (x < 0 || y < 0 || x >= image.getWidth() || y >= image.getHeight()) return count;
        for (var polygon : all) if (polygon.contains(x, y)) return count;
        samples[count] = image.getRGB(x, y);
        return count + 1;
    }

    private static int interpolate(int low, int high, int index) {
        return low + (int) ((long) (high - low) * index / (SAMPLES_PER_SIDE - 1));
    }

    private static void validate(BufferedImage image, RenderRequest request) {
        if (image == null || request == null || image.isAlphaPremultiplied()
            || (image.getType() != BufferedImage.TYPE_INT_ARGB && !NativeArgbRaster.isView(image))
            || image.getWidth() != request.source().widthPx() || image.getHeight() != request.source().heightPx())
            throw new RenderPaintingException(INVALID_INPUT);
    }
    static void checkInterrupted() {
        if (Thread.currentThread().isInterrupted()) throw new RenderPaintingException(CANCELLED);
    }

    /** {@code limit}: pixel bounds of the detected balloon holding the region (with slack), or null. */
    record CleanRegion(RenderRequest.Region region, RasterPolygon polygon, int argb, BalloonMask mask, RasterPolygon.Bounds limit) {
        @Override public String toString() { return "CleanRegion[redacted]"; }
    }
}
