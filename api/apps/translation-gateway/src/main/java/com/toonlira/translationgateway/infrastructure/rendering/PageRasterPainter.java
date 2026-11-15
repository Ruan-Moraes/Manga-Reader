package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderPaintingException.Failure.INVALID_INPUT;
import static com.toonlira.translationgateway.infrastructure.rendering.RenderPaintingException.Failure.UNAVAILABLE;

import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.UnchangedText;
import java.awt.BasicStroke;
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
    private static final int MEDIAN_CAP_MIN_REGIONS = 3;
    private static final double MEDIAN_CAP_FACTOR = 1.35;
    private static final double MEDIAN_FLOOR_FACTOR = .75;
    /** Translation typeset at no less than this share of the source glyph size (CJK sources, see glyphFloor). */
    private static final double GLYPH_FLOOR_FACTOR = .75;
    /** Growth seeds for the floor: the whole start box, then its middle 60% and 35% (see raiseToFloor). */
    private static final double[] SEED_BANDS = {1, .6, .35};
    private static final java.util.Set<String> SQUARE_GLYPH_SOURCES = java.util.Set.of("ja", "zh-Hans", "zh-Hant", "ko");
    /** Below this share of source ink inside the balloon the text sits on artwork: the original is preserved. */
    private static final double MIN_ENCLOSED_INK = .25;
    private static final int BLACK = 0xff000000, WHITE = 0xffffffff;
    private static final int[] COLOR_CHANNEL_SHIFTS = {16, 8, 0};
    /** Pixels added around an inpainted box so antialiased source strokes are reconstructed too. */
    private static final int INPAINT_MARGIN = 4;
    /** Slant of hand-drawn lettering below which it is drawn upright, and the most it is followed. */
    private static final double MIN_TILT = .05, MAX_TILT = .5;
    private final BundledRenderingFonts fonts;
    private final CleanBoxPainter boxes = new CleanBoxPainter();
    private final Inpainter inpainter;

    public PageRasterPainter(BundledRenderingFonts fonts) { this(fonts, null); }

    /** {@code inpainter} may be null: text over artwork then keeps its original lettering. */
    public PageRasterPainter(BundledRenderingFonts fonts, Inpainter inpainter) {
        if (fonts == null) throw new RenderPaintingException(INVALID_INPUT);
        this.fonts = fonts;
        this.inpainter = inpainter;
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
        var policy = request.policy();
        var plans = new Plan[regions.size()];
        var preserved = new boolean[regions.size()];
        var inpaint = new boolean[regions.size()];
        var lettering = new boolean[regions.size()];
        var letteringPlans = new Plan[regions.size()];
        for (int i = 0; i < plans.length; i++) {
            CleanBoxPainter.checkInterrupted();
            var region = regions.get(i);
            // Hand-drawn shouts are planned apart: their size follows their own drawing, not the page median.
            lettering[i] = letters(region, request);
            if (lettering[i]) { inpaint[i] = true; letteringPlans[i] = planLettering(region, request); continue; }
            inpaint[i] = inpaints(region, request);
            preserved[i] = !inpaint[i] && preserveOriginal(region);
            if (!preserved[i]) plans[i] = plan(region, request, policy.maximumFontPx(), inpaint[i]);
        }
        int cap = fontCap(plans, policy);
        if (cap < policy.maximumFontPx()) {
            for (int i = 0; i < plans.length; i++) {
                if (plans[i] != null && plans[i].size() > cap) plans[i] = plan(regions.get(i), request, cap, inpaint[i]);
            }
        }
        var fixedSize = new boolean[regions.size()];
        for (int i = 0; i < plans.length; i++) fixedSize[i] = preserved[i] || inpaint[i];
        raiseToFloor(image, regions, plans, fixedSize, request, cap);
        // Speech the flat path still cannot fit, even grown into its balloon (lettering on paper broken up by speed
        // lines, so no balloon interior holds it), is rebuilt by the inpainter and retyped in its own box.
        for (int i = 0; i < plans.length; i++) {
            if (plans[i] != null || inpaint[i] || preserved[i] || lettering[i] || inpainter == null
                || !request.captionHints().contains(regions.get(i).region().id())) continue;
            var fallback = plan(regions.get(i), request, cap, true);
            if (fallback != null) { inpaint[i] = true; plans[i] = fallback; }
        }
        for (int i = 0; i < plans.length; i++) if (lettering[i]) plans[i] = letteringPlans[i];
        // Halo sets are computed on the untouched raster, so no region erases text another one already drew.
        var halos = new ArrayList<List<Integer>>(plans.length);
        for (int i = 0; i < plans.length; i++) {
            var reserved = new ArrayList<RasterPolygon.Bounds>();
            for (int j = 0; j < plans.length; j++) if (j != i && plans[j] != null) reserved.add(plans[j].clipBox());
            halos.add(plans[i] == null || inpaint[i] ? List.of() : CleanBoxPainter.halo(image, regions.get(i), reserved));
        }
        // Speech over artwork: the artwork under it is reconstructed before any text is drawn. If that fails the
        // region keeps its original lettering, exactly as without an inpainter.
        for (int i = 0; i < plans.length; i++) {
            if (!inpaint[i] || plans[i] == null) continue;
            CleanBoxPainter.checkInterrupted();
            var bounds = regions.get(i).polygon().bounds();
            if (!inpainter.inpaint(image, new int[]{bounds.left() - INPAINT_MARGIN, bounds.top() - INPAINT_MARGIN,
                bounds.right() + INPAINT_MARGIN, bounds.bottom() + INPAINT_MARGIN})) plans[i] = null;
        }
        for (int i = 0; i < plans.length; i++) {
            CleanBoxPainter.checkInterrupted();
            var region = regions.get(i);
            var plan = plans[i];
            if (plan == null) {
                // Not drawn (no fit, text over artwork, or nothing to replace): the original stays untouched.
                placements.add(new RenderManifest.Placement(region.region().id(), true, 0));
                continue;
            }
            if (inpaint[i]) {
                // Over reconstructed artwork: dark lettering with a light outline, readable on any drawing.
                draw(image, canvas, region.polygon(), plan.clipBox(), plan.lines(), BLACK, WHITE,
                    lettering[i] ? letteringOutline(plan.size()) : outline(plan.size()));
            } else {
                boxes.fillMasked(image, region, halos.get(i));
                if (plan.grown()) fillBox(image, plan.clipBox(), region.argb());
                draw(image, canvas, region.polygon(), plan.clipBox(), plan.lines(), contrast(region.argb()), 0, 0);
            }
            placements.add(new RenderManifest.Placement(region.region().id(), false, plan.size()));
        }
        return List.copyOf(placements);
    }

    /**
     * Text this painter erases by inpainting instead of a flat fill: speech/caption over artwork (render hint + mask),
     * or any translated text in a balloon with a screentone background, where a flat fill leaves a patch.
     */
    private boolean inpaints(CleanBoxPainter.CleanRegion region, RenderRequest request) {
        var text = region.region();
        if (inpainter == null || UnchangedText.unchanged(text.sourceText(), text.translatedText())) return false;
        if (region.mask().screentone() && region.mask().enclosedInk() >= MIN_ENCLOSED_INK) return true;
        return request.captionHints().contains(text.id()) && region.mask().enclosedInk() < MIN_ENCLOSED_INK;
    }

    private Plan plan(CleanBoxPainter.CleanRegion region, RenderRequest request, int maximumFontPx, boolean inpainted) {
        if (!inpainted) return planFor(region, request, maximumFontPx);
        // The whole box is reconstructed, so text may use the polygon's inscribed box (no balloon mask), leaving
        // room for the outline; it is clipped to the inpainted box.
        var bounds = region.polygon().bounds();
        var clip = new RasterPolygon.Bounds(bounds.left() - INPAINT_MARGIN, bounds.top() - INPAINT_MARGIN,
            bounds.right() + INPAINT_MARGIN, bounds.bottom() + INPAINT_MARGIN);
        var box = region.polygon().interiorBox(request.policy().paddingPx());
        return compose(region.region().translatedText(), request.pair().target(), box, request.policy(), maximumFontPx, clip, false);
    }

    private static int outline(int fontSize) { return Math.max(2, Math.round(fontSize / 8f)); }

    /** Shouts get a heavier light outline, closer to hand-drawn lettering. */
    private static int letteringOutline(int fontSize) { return Math.max(3, Math.round(fontSize / 5f)); }

    /** Hand-drawn lettering of a sentence (render hint) that this painter can erase by inpainting and retype. */
    private boolean letters(CleanBoxPainter.CleanRegion region, RenderRequest request) {
        var text = region.region();
        return inpainter != null && request.letteringHints().contains(text.id())
            && !UnchangedText.unchanged(text.sourceText(), text.translatedText());
    }

    /**
     * A shout in the heavy face, filling the original drawing's own box and slanted like it: the box follows the OCR
     * polygon's sides (not the axis-aligned bounds), the text is composed upright in it and rotated by the polygon's
     * tilt from the nearest axis (at most {@link #MAX_TILT} radians).
     */
    private Plan planLettering(CleanBoxPainter.CleanRegion region, RenderRequest request) {
        var vertices = region.region().polygon();
        int width = request.source().widthPx(), height = request.source().heightPx();
        double[] xs = new double[4], ys = new double[4];
        for (int k = 0; k < 4; k++) { xs[k] = vertices.get(k).x() * width; ys[k] = vertices.get(k).y() * height; }
        double ax = xs[1] - xs[0], ay = ys[1] - ys[0], bx = xs[2] - xs[1], by = ys[2] - ys[1];
        double lengthA = Math.hypot(ax, ay), lengthB = Math.hypot(bx, by);
        double angleA = Math.atan2(ay, ax);
        double tilt = angleA - Math.round(angleA / (Math.PI / 2)) * (Math.PI / 2);
        if (Math.abs(tilt) < MIN_TILT) tilt = 0;
        tilt = Math.clamp(tilt, -MAX_TILT, MAX_TILT);
        // Side A runs along x when its angle is nearer the horizontal axis.
        boolean aHorizontal = Math.abs(Math.cos(angleA)) >= Math.abs(Math.sin(angleA));
        double boxWidth = aHorizontal ? lengthA : lengthB, boxHeight = aHorizontal ? lengthB : lengthA;
        double cx = (xs[0] + xs[1] + xs[2] + xs[3]) / 4, cy = (ys[0] + ys[1] + ys[2] + ys[3]) / 4;
        int padding = request.policy().paddingPx();
        var box = new RasterPolygon.Bounds((int) Math.round(cx - boxWidth / 2) + padding, (int) Math.round(cy - boxHeight / 2) + padding,
            (int) Math.round(cx + boxWidth / 2) - padding, (int) Math.round(cy + boxHeight / 2) - padding);
        var bounds = region.polygon().bounds();
        var clip = new RasterPolygon.Bounds(bounds.left() - INPAINT_MARGIN, bounds.top() - INPAINT_MARGIN,
            bounds.right() + INPAINT_MARGIN, bounds.bottom() + INPAINT_MARGIN);
        var upright = compose(region.region().translatedText(), request.pair().target(), box, request.policy(),
            request.policy().maximumFontPx(), clip, false, true);
        if (upright == null || tilt == 0) return upright;
        var rotate = AffineTransform.getRotateInstance(tilt, cx, cy);
        var lines = new ArrayList<GlyphLine>(upright.lines().size());
        for (var line : upright.lines()) {
            var shape = rotate.createTransformedShape(line.outline());
            lines.add(new GlyphLine(shape, shape.getBounds2D()));
        }
        return new Plan(upright.size(), List.copyOf(lines), clip, false);
    }

    /** Unchanged lettering and text drawn over artwork (little source ink inside a balloon) keep the original. */
    private static boolean preserveOriginal(CleanBoxPainter.CleanRegion region) {
        var text = region.region();
        return UnchangedText.unchanged(text.sourceText(), text.translatedText())
            || region.mask().enclosedInk() < MIN_ENCLOSED_INK;
    }

    private Plan planFor(CleanBoxPainter.CleanRegion region, RenderRequest request, int maximumFontPx) {
        var text = region.region().translatedText();
        var target = request.pair().target();
        // The layout box is the polygon's inscribed box shrunk until it lies on balloon interior only.
        var padded = region.mask().fit(region.polygon().interiorBox(request.policy().paddingPx()));
        var plan = compose(text, target, padded, request.policy(), maximumFontPx, padded, false);
        if (plan != null || request.policy().paddingPx() == 0) return plan;
        // A tight bubble gets a second chance with the whole inscribed box before the text is given up on.
        var whole = region.mask().fit(region.polygon().interiorBox(0));
        return compose(text, target, whole, request.policy(), maximumFontPx, whole, false);
    }

    /** Median-relative ceiling so one balloon cannot be typeset several times larger than its neighbours. */
    private static int fontCap(Plan[] plans, RenderPolicy policy) {
        double median = median(plans);
        if (Double.isNaN(median)) return policy.maximumFontPx();
        return Math.clamp((int) Math.ceil(median * MEDIAN_CAP_FACTOR), policy.minimumFontPx(), policy.maximumFontPx());
    }

    /**
     * Median-relative floor. A short line in a tight OCR polygon (or one that did not fit at all) is recomposed in a
     * box grown into the flat balloon background around it. The new plan is kept only if it is strictly larger, so
     * the floor never shrinks text and never paints outside verified background.
     *
     * <p>CJK sources also get a floor from their own lettering: vertical columns are narrow, so a horizontal
     * translation confined to them comes out far smaller than the original glyphs, and the page median (made of
     * such columns) cannot notice it.
     */
    private void raiseToFloor(BufferedImage image, List<CleanBoxPainter.CleanRegion> regions, Plan[] plans,
                              boolean[] preserved, RenderRequest request, int cap) {
        double median = median(plans);
        boolean squareGlyphs = SQUARE_GLYPH_SOURCES.contains(request.pair().source());
        if (Double.isNaN(median) && !squareGlyphs) return;
        var policy = request.policy();
        int floor = Double.isNaN(median) ? policy.minimumFontPx()
            : Math.clamp((int) Math.ceil(median * MEDIAN_FLOOR_FACTOR), policy.minimumFontPx(), cap);
        var claimed = new ArrayList<RasterPolygon.Bounds>();
        for (int i = 0; i < plans.length; i++) {
            CleanBoxPainter.checkInterrupted();
            var region = regions.get(i);
            int target = squareGlyphs ? Math.max(floor, Math.min(cap, glyphFloor(region))) : floor;
            if (preserved[i] || plans[i] != null && plans[i].size() >= target) continue;
            var start = region.mask().fit(region.polygon().interiorBox(0));
            int limit = Math.max(start.bottom() - start.top(), 2 * target);
            Plan best = plans[i];
            RasterPolygon.Bounds bestBox = null;
            // A tall column in an oval balloon already touches the curved border at its ends, so it cannot widen;
            // its middle band can. Each seed is grown and the largest resulting font wins.
            for (double band : SEED_BANDS) {
                var seed = band(start, band);
                if (seed == null) continue;
                // Bands widen first (horizontal text needs width), then grow vertically into what is left.
                var grown = band == 1 ? BalloonExpansion.expand(image, region, regions, claimed, seed, limit)
                    : BalloonExpansion.expand(image, region, regions, claimed,
                        BalloonExpansion.expand(image, region, regions, claimed, seed, limit, false), limit);
                if (grown.equals(seed) && band == 1) continue;
                var padded = new RasterPolygon.Bounds(grown.left() + policy.paddingPx(), grown.top() + policy.paddingPx(),
                    grown.right() - policy.paddingPx(), grown.bottom() - policy.paddingPx());
                var plan = compose(region.region().translatedText(), request.pair().target(), padded, policy, cap, grown, true);
                if (plan != null && (best == null || plan.size() > best.size())) { best = plan; bestBox = grown; }
            }
            if (bestBox != null) { plans[i] = best; claimed.add(bestBox); }
        }
    }

    /** The vertically centred share {@code fraction} of a box, full width; null when too thin to grow from. */
    private static RasterPolygon.Bounds band(RasterPolygon.Bounds box, double fraction) {
        if (fraction >= 1) return box;
        int height = (int) Math.round((box.bottom() - box.top()) * fraction);
        if (height < 4 || box.right() <= box.left()) return null;
        int top = box.top() + (box.bottom() - box.top() - height) / 2;
        return new RasterPolygon.Bounds(box.left(), top, box.right(), top + height);
    }

    /**
     * Source glyph size of square-glyph scripts, estimated as sqrt(area / characters) of the OCR box (gaps between
     * columns make it a slight overestimate, absorbed by the factor), times {@link #GLYPH_FLOOR_FACTOR}.
     */
    static int glyphFloor(CleanBoxPainter.CleanRegion region) {
        long characters = region.region().sourceText().codePoints().filter(Character::isLetterOrDigit).count();
        if (characters == 0) return 0;
        var bounds = region.polygon().bounds();
        double area = (double) (bounds.right() - bounds.left()) * (bounds.bottom() - bounds.top());
        return (int) Math.ceil(GLYPH_FLOOR_FACTOR * Math.sqrt(area / characters));
    }

    private static double median(Plan[] plans) {
        int[] sizes = Arrays.stream(plans).filter(plan -> plan != null).mapToInt(Plan::size).sorted().toArray();
        if (sizes.length < MEDIAN_CAP_MIN_REGIONS) return Double.NaN;
        return sizes.length % 2 == 1 ? sizes[sizes.length / 2]
            : (sizes[sizes.length / 2 - 1] + sizes[sizes.length / 2]) / 2.0;
    }

    private Plan compose(String text, String target, RasterPolygon.Bounds box, RenderPolicy policy, int maximumFontPx,
                         RasterPolygon.Bounds clipBox, boolean grown) {
        return compose(text, target, box, policy, maximumFontPx, clipBox, grown, false);
    }

    /** {@code heavy}: the hand-lettering face ({@link BundledRenderingFonts#letteringFontFor}). */
    private Plan compose(String text, String target, RasterPolygon.Bounds box, RenderPolicy policy, int maximumFontPx,
                         RasterPolygon.Bounds clipBox, boolean grown, boolean heavy) {
        if (!fonts.canDisplay(target, text) || unsupportedControl(text) || box.right() <= box.left() || box.bottom() <= box.top())
            return null;
        for (int size = maximumFontPx; size >= policy.minimumFontPx(); size--) {
            CleanBoxPainter.checkInterrupted();
            var font = heavy ? fonts.letteringFontFor(target, size) : fonts.fontFor(target, size);
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
                    // requireNextWord: a word wider than the box is never split mid-word ("YouTu / be"); the font
                    // shrinks instead, and if it still does not fit the region keeps its original.
                    var line = measurer.nextLayout(box.right() - box.left(), paragraph.length(), true);
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
            return new Plan(size, List.copyOf(outlines), clipBox, grown);
        }
        return null;
    }

    private static double visualWidth(TextLayout line) {
        var bounds = line.getBounds();
        return Math.max(line.getAdvance(), bounds.getMaxX()) - Math.min(0, bounds.getMinX());
    }

    private static void draw(BufferedImage image, BufferedImage canvas, RasterPolygon polygon, RasterPolygon.Bounds clipBox,
                             List<GlyphLine> lines, int ink, int outlineColor, int outlineWidth) {
        var row = ((DataBufferInt) canvas.getRaster().getDataBuffer()).getData();
        var graphics = canvas.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            var stroke = outlineWidth > 0
                ? new BasicStroke(2f * outlineWidth, BasicStroke.CAP_ROUND, BasicStroke.JOIN_ROUND) : null;
            int top = Math.max(0, clipBox == null ? polygon.bounds().top() : clipBox.top());
            int bottom = Math.min(image.getHeight(), clipBox == null ? polygon.bounds().bottom() : clipBox.bottom());
            for (int y = top; y < bottom; y++) {
                CleanBoxPainter.checkInterrupted();
                var span = clip(polygon, clipBox, y);
                if (span == null) continue;
                Arrays.fill(row, 0);
                graphics.setTransform(AffineTransform.getTranslateInstance(0, -y));
                for (var line : lines) {
                    if (line.bounds().getMinY() - outlineWidth >= y + 1 || line.bounds().getMaxY() + outlineWidth <= y) continue;
                    if (stroke != null) {
                        // Outline first, glyph on top: the halo never covers the letter itself.
                        graphics.setColor(new Color(outlineColor, true));
                        graphics.setStroke(stroke);
                        graphics.draw(line.outline());
                    }
                    graphics.setColor(new Color(ink, true));
                    graphics.fill(line.outline());
                }
                for (int x = Math.max(0, span.start()); x < Math.min(image.getWidth(), span.end()); x++) {
                    int coverage = row[x] >>> 24;
                    if (coverage != 0) image.setRGB(x, y, over(row[x], image.getRGB(x, y)));
                }
            }
        } finally { graphics.dispose(); }
    }

    /** Every plan is laid out inside its verified box, so that box alone is its clip. */
    private static RasterPolygon.Span clip(RasterPolygon polygon, RasterPolygon.Bounds clipBox, int y) {
        if (clipBox == null) return polygon.span(y);
        return y < clipBox.top() || y >= clipBox.bottom() ? null : new RasterPolygon.Span(clipBox.left(), clipBox.right());
    }

    /** The grown box was verified as flat background or near-text noise, so it is cleaned as a whole. */
    private static void fillBox(BufferedImage image, RasterPolygon.Bounds box, int argb) {
        var row = new int[box.right() - box.left()];
        Arrays.fill(row, argb);
        for (int y = box.top(); y < box.bottom(); y++) {
            CleanBoxPainter.checkInterrupted();
            image.setRGB(box.left(), y, row.length, 1, row, 0, row.length);
        }
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
    /**
     * {@code clipBox} is the layout box, verified to lie on balloon interior (mask-fitted, or grown into flat
     * background when {@code grown}); glyphs are clipped to it, never to the raw OCR polygon.
     */
    private record Plan(int size, List<GlyphLine> lines, RasterPolygon.Bounds clipBox, boolean grown) { }
}
