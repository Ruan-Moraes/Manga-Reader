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
            prepared.add(new CleanRegion(request.regions().get(i), polygons.get(i),
                surroundingColor(image, polygons.get(i), polygons, Math.max(1, request.policy().paddingPx()))));
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

    record CleanRegion(RenderRequest.Region region, RasterPolygon polygon, int argb) {
        @Override public String toString() { return "CleanRegion[redacted]"; }
    }
}
