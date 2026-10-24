package com.toonlira.translationgateway.domain.layout;

import com.toonlira.translationgateway.domain.OcrGeometry;
import com.toonlira.translationgateway.domain.OcrManifest.Vertex;

import java.util.ArrayList;
import java.util.List;

public final class LayoutGeometry {
    private LayoutGeometry() { }

    /** Sutherland-Hodgman clipping; a rotated OCR polygon is not its bounding rectangle. */
    public static double containment(List<Vertex> polygon, LayoutBox box) {
        if (!OcrGeometry.valid(polygon)) throw new LayoutFailure(LayoutFailure.Code.INVALID_RESPONSE);
        var clipped = polygon;
        clipped = clip(clipped, true, box.left(), true);
        clipped = clip(clipped, true, box.right(), false);
        clipped = clip(clipped, false, box.top(), true);
        clipped = clip(clipped, false, box.bottom(), false);
        return area(clipped) / area(polygon);
    }

    public static LayoutBox bounds(List<Vertex> polygon) {
        if (!OcrGeometry.valid(polygon)) throw new LayoutFailure(LayoutFailure.Code.INVALID_RESPONSE);
        return new LayoutBox(polygon.stream().mapToDouble(Vertex::x).min().orElseThrow(),
            polygon.stream().mapToDouble(Vertex::y).min().orElseThrow(),
            polygon.stream().mapToDouble(Vertex::x).max().orElseThrow(),
            polygon.stream().mapToDouble(Vertex::y).max().orElseThrow());
    }

    private static List<Vertex> clip(List<Vertex> input, boolean xAxis, double boundary, boolean minimum) {
        var output = new ArrayList<Vertex>();
        if (input.isEmpty()) return output;
        var previous = input.getLast();
        for (var current : input) {
            double from = xAxis ? previous.x() : previous.y();
            double to = xAxis ? current.x() : current.y();
            boolean fromInside = minimum ? from >= boundary : from <= boundary;
            boolean toInside = minimum ? to >= boundary : to <= boundary;
            if (fromInside != toInside) {
                double fraction = (boundary - from) / (to - from);
                output.add(new Vertex(previous.x() + fraction * (current.x() - previous.x()),
                    previous.y() + fraction * (current.y() - previous.y())));
            }
            if (toInside) output.add(current);
            previous = current;
        }
        return output;
    }

    private static double area(List<Vertex> polygon) {
        double twiceArea = 0;
        for (int i = 0; i < polygon.size(); i++) {
            var a = polygon.get(i);
            var b = polygon.get((i + 1) % polygon.size());
            twiceArea += a.x() * b.y() - b.x() * a.y();
        }
        return Math.abs(twiceArea) / 2;
    }
}
