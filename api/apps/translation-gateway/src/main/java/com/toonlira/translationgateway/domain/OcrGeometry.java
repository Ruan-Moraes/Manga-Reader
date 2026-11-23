package com.toonlira.translationgateway.domain;

import java.util.List;

public final class OcrGeometry {
    private static final double MIN_CROSS_PRODUCT = 1e-8;

    private OcrGeometry() { }

    public static boolean valid(List<OcrManifest.Vertex> polygon) {
        if (polygon == null || polygon.size() != 4) return false;
        for (var point : polygon) {
            if (point == null || !Double.isFinite(point.x()) || !Double.isFinite(point.y())
                || point.x() < 0 || point.x() > 1 || point.y() < 0 || point.y() > 1) return false;
        }
        double direction = 0;
        for (int i = 0; i < 4; i++) {
            var a = polygon.get(i);
            var b = polygon.get((i + 1) % 4);
            var c = polygon.get((i + 2) % 4);
            double cross = (b.x() - a.x()) * (c.y() - b.y()) - (b.y() - a.y()) * (c.x() - b.x());
            if (Math.abs(cross) < MIN_CROSS_PRODUCT) return false;
            if (direction != 0 && Math.signum(cross) != direction) return false;
            direction = Math.signum(cross);
        }
        return true;
    }
}
