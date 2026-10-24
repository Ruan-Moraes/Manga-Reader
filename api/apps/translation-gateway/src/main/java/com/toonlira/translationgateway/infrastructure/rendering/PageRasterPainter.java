package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderPaintingException.Failure.INVALID_INPUT;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderPaintingException.Failure.UNAVAILABLE;

import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import java.awt.Color;
import java.awt.RenderingHints;
import java.awt.Shape;
import java.awt.font.FontRenderContext;
import java.awt.font.LineBreakMeasurer;
import java.awt.font.TextAttribute;
import java.awt.font.TextLayout;
import java.awt.geom.AffineTransform;
import java.awt.geom.Rectangle2D;
import java.awt.image.BufferedImage;
import java.awt.image.DataBufferInt;
import java.text.AttributedString;
import java.text.BreakIterator;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Explicit local raster compositor, not a bean or worker entry point. Text is inert and fallback is never truncated. */
public final class PageRasterPainter {
    private static final Map<String, Locale> LOCALES = Map.of("ja", Locale.JAPANESE, "en", Locale.ENGLISH,
        "es", Locale.forLanguageTag("es"), "ko", Locale.KOREAN, "zh-Hans", Locale.SIMPLIFIED_CHINESE,
        "zh-Hant", Locale.TRADITIONAL_CHINESE, "pt-BR", Locale.forLanguageTag("pt-BR"));
    private static final FontRenderContext FONT_CONTEXT = new FontRenderContext(null, true, true);
    private static final int BLACK = 0xff000000, WHITE = 0xffffffff;
    private static final int[] COLOR_CHANNEL_SHIFTS = {16, 8, 0};
    private final BundledRenderingFonts fonts;
    private final CleanBoxPainter boxes = new CleanBoxPainter();

    public PageRasterPainter(BundledRenderingFonts fonts) {
        if (fonts == null) throw new RenderPaintingException(INVALID_INPUT);
        this.fonts = fonts;
    }

    public List<RenderManifest.Placement> paint(BufferedImage image, RenderRequest request) {
        try { return paintVerifiedRaster(image, request); }
        catch (RenderPaintingException error) { throw error; }
        catch (RuntimeException error) { throw new RenderPaintingException(UNAVAILABLE); }
    }

    private List<RenderManifest.Placement> paintVerifiedRaster(BufferedImage image, RenderRequest request) {
        var regions = boxes.prepare(image, request);
        if (regions.isEmpty()) return List.of();
        var placements = new ArrayList<RenderManifest.Placement>(regions.size());
        var backgroundRow = new int[image.getWidth()];
        // Antialiasing is evaluated on one row only. Transfer is explicitly restricted to OCR pixel-center spans.
        var canvas = new BufferedImage(image.getWidth(), 1, BufferedImage.TYPE_INT_ARGB);
        for (var region : regions) {
            CleanBoxPainter.checkInterrupted();
            var bounds = region.polygon().interiorBox(request.policy().paddingPx());
            var plan = compose(region.region().translatedText(), request.pair().target(), bounds, request.policy());
            boxes.fill(image, region, backgroundRow);
            int ink = contrast(region.argb());
            if (plan == null) {
                marker(image, region.polygon(), bounds, ink);
                placements.add(new RenderManifest.Placement(region.region().id(), true, 0));
            } else {
                draw(image, canvas, region.polygon(), plan.lines(), ink);
                placements.add(new RenderManifest.Placement(region.region().id(), false, plan.size()));
            }
        }
        return List.copyOf(placements);
    }

    private Plan compose(String text, String target, RasterPolygon.Bounds box, RenderPolicy policy) {
        if (!fonts.canDisplay(target, text) || unsupportedControl(text) || box.right() <= box.left() || box.bottom() <= box.top())
            return null;
        for (int size = policy.maximumFontPx(); size >= policy.minimumFontPx(); size--) {
            CleanBoxPainter.checkInterrupted();
            var font = fonts.fontFor(target, size);
            var metrics = font.getLineMetrics("Ag", FONT_CONTEXT);
            float lineHeight = (float) Math.ceil(metrics.getAscent() + metrics.getDescent() + metrics.getLeading());
            var lines = new ArrayList<TextLayout>();
            boolean fits = true;
            for (String paragraph : text.split("\\r\\n|\\r|\\n", -1)) {
                CleanBoxPainter.checkInterrupted();
                if (paragraph.isEmpty()) {
                    lines.add(null);
                    if (lines.size() * lineHeight > box.bottom() - box.top()) { fits = false; break; }
                    continue;
                }
                var attributed = new AttributedString(paragraph);
                attributed.addAttribute(TextAttribute.FONT, font);
                attributed.addAttribute(TextAttribute.RUN_DIRECTION, TextAttribute.RUN_DIRECTION_LTR);
                var measurer = new LineBreakMeasurer(attributed.getIterator(), BreakIterator.getLineInstance(LOCALES.get(target)), FONT_CONTEXT);
                while (measurer.getPosition() < paragraph.length()) {
                    CleanBoxPainter.checkInterrupted();
                    int before = measurer.getPosition();
                    var line = measurer.nextLayout(box.right() - box.left());
                    if (line == null || measurer.getPosition() <= before || visualWidth(line) > box.right() - box.left()) {
                        fits = false; break;
                    }
                    lines.add(line);
                    if (lines.size() * lineHeight > box.bottom() - box.top()) { fits = false; break; }
                }
                if (!fits) break;
            }
            if (!fits) continue;
            float baseline = box.top() + (box.bottom() - box.top() - lines.size() * lineHeight) / 2 + metrics.getAscent();
            var outlines = new ArrayList<GlyphLine>();
            for (var line : lines) {
                if (line != null) {
                    double minX = Math.min(0, line.getBounds().getMinX());
                    double x = box.left() + (box.right() - box.left() - visualWidth(line)) / 2 - minX;
                    Shape outline = line.getOutline(AffineTransform.getTranslateInstance(x, baseline));
                    outlines.add(new GlyphLine(outline, outline.getBounds2D()));
                }
                baseline += lineHeight;
            }
            return new Plan(size, List.copyOf(outlines));
        }
        return null;
    }

    private static double visualWidth(TextLayout line) {
        var bounds = line.getBounds();
        return Math.max(line.getAdvance(), bounds.getMaxX()) - Math.min(0, bounds.getMinX());
    }

    private static void draw(BufferedImage image, BufferedImage canvas, RasterPolygon polygon, List<GlyphLine> lines, int ink) {
        var row = ((DataBufferInt) canvas.getRaster().getDataBuffer()).getData();
        var graphics = canvas.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            graphics.setColor(new Color(ink, true));
            for (int y = polygon.bounds().top(); y < polygon.bounds().bottom(); y++) {
                CleanBoxPainter.checkInterrupted();
                var span = polygon.span(y);
                if (span == null) continue;
                Arrays.fill(row, 0);
                graphics.setTransform(AffineTransform.getTranslateInstance(0, -y));
                for (var line : lines) if (line.bounds().getMinY() < y + 1 && line.bounds().getMaxY() > y) graphics.fill(line.outline());
                for (int x = span.start(); x < span.end(); x++) {
                    int coverage = row[x] >>> 24;
                    if (coverage != 0) image.setRGB(x, y, over(row[x], image.getRGB(x, y)));
                }
            }
        } finally { graphics.dispose(); }
    }

    private static void marker(BufferedImage image, RasterPolygon polygon, RasterPolygon.Bounds box, int ink) {
        int width = box.right() - box.left(), height = box.bottom() - box.top();
        if (width < 5 || height < 1) return;
        int x = box.left() + (width - 5) / 2, y = box.top() + height / 2;
        for (int offset : new int[]{0, 2, 4}) if (polygon.contains(x + offset, y)) image.setRGB(x + offset, y, ink);
    }

    private static int over(int source, int destination) {
        int sa = source >>> 24, da = destination >>> 24;
        double alpha = sa / 255.0 + da / 255.0 * (1 - sa / 255.0);
        if (alpha == 0) return destination;
        int result = (int) Math.round(alpha * 255) << 24;
        for (int shift : COLOR_CHANNEL_SHIFTS) {
            double premultiplied = ((source >>> shift) & 255) * sa / 255.0
                + ((destination >>> shift) & 255) * da / 255.0 * (1 - sa / 255.0);
            result |= Math.clamp((int) Math.round(premultiplied / alpha), 0, 255) << shift;
        }
        return result;
    }

    private static int contrast(int argb) {
        double alpha = (argb >>> 24) / 255.0;
        double red = channel(((argb >>> 16) & 255) * alpha + 255 * (1 - alpha));
        double green = channel(((argb >>> 8) & 255) * alpha + 255 * (1 - alpha));
        double blue = channel((argb & 255) * alpha + 255 * (1 - alpha));
        double luminance = .2126 * red + .7152 * green + .0722 * blue;
        return (luminance + .05) / .05 >= 1.05 / (luminance + .05) ? BLACK : WHITE;
    }
    private static double channel(double value) {
        double normalized = value / 255;
        return normalized <= .04045 ? normalized / 12.92 : Math.pow((normalized + .055) / 1.055, 2.4);
    }
    private static boolean unsupportedControl(String text) {
        return text.codePoints().anyMatch(point -> Character.isISOControl(point) && point != '\n' && point != '\r');
    }
    private record GlyphLine(Shape outline, Rectangle2D bounds) { }
    private record Plan(int size, List<GlyphLine> lines) { }
}
