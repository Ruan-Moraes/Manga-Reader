package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderPaintingException.Failure.INVALID_INPUT;

import com.toonlira.translationgateway.domain.OcrGeometry;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import java.util.List;

/** Compact convex quadrilateral. Pixel-center spans never expand to its bounding rectangle. */
final class RasterPolygon {
    private static final double PIXEL_CENTER = .5;
    private final double[] x = new double[4];
    private final double[] y = new double[4];
    private final Bounds bounds;
    private final int width;
    private final boolean hasPixels;

    RasterPolygon(List<OcrManifest.Vertex> vertices, int width, int height) {
        if (!OcrGeometry.valid(vertices) || width <= 0 || height <= 0
            || width > RenderPolicy.MAX_DIMENSION_PX || height > RenderPolicy.MAX_DIMENSION_PX
            || (long) width * height > RenderPolicy.MAX_PIXELS) throw new RenderPaintingException(INVALID_INPUT);
        this.width = width;
        double minX = width, minY = height, maxX = 0, maxY = 0;
        for (int i = 0; i < 4; i++) {
            x[i] = Math.clamp(vertices.get(i).x() * width, 0, width);
            y[i] = Math.clamp(vertices.get(i).y() * height, 0, height);
            minX = Math.min(minX, x[i]); maxX = Math.max(maxX, x[i]);
            minY = Math.min(minY, y[i]); maxY = Math.max(maxY, y[i]);
        }
        bounds = new Bounds(centerIndex(minX, width), centerIndex(minY, height),
            centerIndex(maxX, width), centerIndex(maxY, height));
        boolean covered = false;
        for (int row = bounds.top(); row < bounds.bottom() && !covered; row++) covered = span(row) != null;
        hasPixels = covered;
    }

    Span span(int row) {
        if (row < bounds.top() || row >= bounds.bottom()) return null;
        double center = row + PIXEL_CENTER, left = Double.POSITIVE_INFINITY, right = Double.NEGATIVE_INFINITY;
        for (int i = 0; i < 4; i++) {
            int next = (i + 1) % 4;
            if ((y[i] <= center && center < y[next]) || (y[next] <= center && center < y[i])) {
                double intersection = x[i] + (center - y[i]) * (x[next] - x[i]) / (y[next] - y[i]);
                left = Math.min(left, intersection); right = Math.max(right, intersection);
            }
        }
        if (!Double.isFinite(left) || !Double.isFinite(right)) return null;
        int start = centerIndex(left, width), end = centerIndex(right, width);
        return start < end ? new Span(start, end) : null;
    }

    boolean contains(int column, int row) {
        if (column < bounds.left() || column >= bounds.right()) return false;
        var span = span(row);
        return span != null && column >= span.start() && column < span.end();
    }

    /** A deterministic inscribed rectangle, never the unrestricted bounding box of a tilted region. */
    Bounds interiorBox(int padding) {
        Bounds best = new Bounds(0, 0, 0, 0);
        long bestArea = 0;
        int height = bounds.bottom() - bounds.top();
        for (int cut = 0; cut < 4; cut++) {
            int trim = height * cut / 8;
            int top = bounds.top() + trim + padding, bottom = bounds.bottom() - trim - padding;
            if (top >= bottom) continue;
            int left = bounds.left(), right = bounds.right();
            // In a convex polygon each span boundary is piecewise linear. Extrema occur at band ends or vertices.
            var rows = new int[10];
            rows[0] = top; rows[1] = bottom - 1;
            for (int i = 0; i < 4; i++) {
                rows[2 + i * 2] = Math.clamp((int) Math.floor(y[i] - PIXEL_CENTER), top, bottom - 1);
                rows[3 + i * 2] = Math.clamp((int) Math.ceil(y[i] - PIXEL_CENTER), top, bottom - 1);
            }
            for (int row : rows) {
                var span = span(row);
                if (span == null) { right = left; break; }
                left = Math.max(left, span.start()); right = Math.min(right, span.end());
            }
            left += padding; right -= padding;
            long area = right > left ? (long) (right - left) * (bottom - top) : 0;
            if (area > bestArea) { bestArea = area; best = new Bounds(left, top, right, bottom); }
        }
        return best;
    }

    Bounds bounds() { return bounds; }
    boolean hasPixels() { return hasPixels; }
    @Override public String toString() { return "RasterPolygon[redacted]"; }

    private static int centerIndex(double coordinate, int limit) {
        return Math.clamp((int) Math.ceil(coordinate - PIXEL_CENTER), 0, limit);
    }
    record Bounds(int left, int top, int right, int bottom) { }
    record Span(int start, int end) { }
}
