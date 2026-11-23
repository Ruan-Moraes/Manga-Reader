package com.toonlira.translationgateway.domain.layout;

import java.util.ArrayList;
import java.util.List;
import java.util.function.BooleanSupplier;

import static com.toonlira.translationgateway.domain.layout.LayoutParameters.*;

/** Recursive whitespace cuts. Lack of a root cut is inconclusive, not a one-panel prediction. */
public final class RegularPanelDetector {
    public List<Panel> detect(PixelImage image, ReadingDirection direction) {
        return detect(image, direction, () -> false);
    }

    public List<Panel> detect(PixelImage image, ReadingDirection direction, BooleanSupplier cancelled) {
        if (image == null || direction == null || image.width() < 1 || image.height() < 1)
            throw new IllegalArgumentException("Image and direction required");
        var result = new ArrayList<Panel>();
        split(image, trim(image, new Bounds(0, 0, image.width(), image.height()), cancelled),
            direction, cancelled, result, true);
        return List.copyOf(result);
    }

    private void split(PixelImage image, Bounds bounds, ReadingDirection direction, BooleanSupplier cancelled,
                       List<Panel> result, boolean root) {
        checkCancelled(cancelled);
        if (bounds.width() == 0 || bounds.height() == 0) return;
        var horizontal = bestCut(image, bounds, true, cancelled);
        var vertical = bestCut(image, bounds, false, cancelled);
        var cut = horizontal != null && (vertical == null || horizontal.fraction() >= vertical.fraction())
            ? horizontal : vertical;
        if (cut == null) {
            if (!root) {
                if (result.size() >= MAX_PANELS) throw new LayoutFailure(LayoutFailure.Code.LIMIT_EXCEEDED);
                result.add(new Panel("panel-" + result.size(), new LayoutBox(
                    (double) bounds.left / image.width(), (double) bounds.top / image.height(),
                    (double) bounds.right / image.width(), (double) bounds.bottom / image.height())));
            }
            return;
        }
        var first = trim(image, cut.first(bounds), cancelled);
        var second = trim(image, cut.second(bounds), cancelled);
        if (!cut.horizontal && direction == ReadingDirection.rtl) {
            split(image, second, direction, cancelled, result, false);
            split(image, first, direction, cancelled, result, false);
        } else {
            split(image, first, direction, cancelled, result, false);
            split(image, second, direction, cancelled, result, false);
        }
    }

    private Cut bestCut(PixelImage image, Bounds bounds, boolean horizontal, BooleanSupplier cancelled) {
        int lower = horizontal ? bounds.top : bounds.left;
        int upper = horizontal ? bounds.bottom : bounds.right;
        int dimension = upper - lower;
        Cut best = null;
        int start = -1;
        for (int position = lower; position <= upper; position++) {
            checkCancelled(cancelled);
            boolean clear = position < upper && clearLine(image, bounds, horizontal, position);
            if (clear && start < 0) start = position;
            if (!clear && start >= 0) {
                var cut = new Cut(horizontal, start, position, (double) (position - start) / dimension);
                if (start > lower && position < upper && cut.fraction >= MIN_GUTTER_FRACTION
                    && substantial(image, trim(image, cut.first(bounds), cancelled))
                    && substantial(image, trim(image, cut.second(bounds), cancelled))
                    && (best == null || cut.fraction > best.fraction)) best = cut;
                start = -1;
            }
        }
        return best;
    }

    private boolean substantial(PixelImage image, Bounds bounds) {
        return (long) bounds.width() * bounds.height() >= (long) image.width() * image.height() * MIN_PANEL_AREA;
    }

    private Bounds trim(PixelImage image, Bounds bounds, BooleanSupplier cancelled) {
        int left = bounds.left, top = bounds.top, right = bounds.right, bottom = bounds.bottom;
        while (top < bottom && clearLine(image, bounds, true, top)) { checkCancelled(cancelled); top++; }
        while (bottom > top && clearLine(image, bounds, true, bottom - 1)) { checkCancelled(cancelled); bottom--; }
        if (top == bottom) return new Bounds(left, top, left, top);
        var rows = new Bounds(left, top, right, bottom);
        while (left < right && clearLine(image, rows, false, left)) { checkCancelled(cancelled); left++; }
        while (right > left && clearLine(image, rows, false, right - 1)) { checkCancelled(cancelled); right--; }
        return new Bounds(left, top, right, bottom);
    }

    private boolean clearLine(PixelImage image, Bounds bounds, boolean horizontal, int position) {
        int start = horizontal ? bounds.left : bounds.top;
        int end = horizontal ? bounds.right : bounds.bottom;
        int allowedDark = (int) Math.floor((end - start) * (1 - CLEAR_COVERAGE) + 1e-9);
        int dark = 0;
        for (int offset = start; offset < end; offset++) {
            int rgb = horizontal ? image.rgb(offset, position) : image.rgb(position, offset);
            if (((rgb >> 16) & 255) < WHITE_CHANNEL || ((rgb >> 8) & 255) < WHITE_CHANNEL
                || (rgb & 255) < WHITE_CHANNEL) {
                if (++dark > allowedDark) return false;
            }
        }
        return true;
    }

    private void checkCancelled(BooleanSupplier cancelled) {
        if (cancelled.getAsBoolean() || Thread.currentThread().isInterrupted())
            throw new LayoutFailure(LayoutFailure.Code.TIMEOUT);
    }

    private record Bounds(int left, int top, int right, int bottom) {
        int width() { return right - left; }
        int height() { return bottom - top; }
    }

    private record Cut(boolean horizontal, int start, int end, double fraction) {
        Bounds first(Bounds b) {
            return horizontal ? new Bounds(b.left, b.top, b.right, start) : new Bounds(b.left, b.top, start, b.bottom);
        }
        Bounds second(Bounds b) {
            return horizontal ? new Bounds(b.left, end, b.right, b.bottom) : new Bounds(end, b.top, b.right, b.bottom);
        }
    }
}
