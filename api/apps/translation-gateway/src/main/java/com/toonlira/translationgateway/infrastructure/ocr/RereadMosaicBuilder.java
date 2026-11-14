package com.toonlira.translationgateway.infrastructure.ocr;

import com.toonlira.translationgateway.application.port.RereadImagingPort;
import com.toonlira.translationgateway.domain.ocr.MosaicLayout;
import java.awt.Color;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Component;

/**
 * Renders each doubtful crop in {@link #VARIANTS} forms so the provider sees the lettering differently. The set was
 * chosen by measurement (variant lab, Ubunchu! ch02 p.03–04): these four disagreed with the provider's mistakes most
 * often, while a thickened-stroke variant repeated them and was dropped.
 * <ol>
 *   <li>enlarged 2x, colour kept;</li>
 *   <li>enlarged 3x, colour kept;</li>
 *   <li>enlarged 3x, binarized (Otsu) and strokes thinned — separates touching glyphs ("5O" vs "SO");</li>
 *   <li>enlarged 3x, grayscale with contrast stretched — faint or tinted lettering.</li>
 * </ol>
 * Pure CPU image operations in milliseconds; no model, no GPU.
 */
@Component
public class RereadMosaicBuilder implements RereadImagingPort {
    private static final int MAX_TILE_HEIGHT = 1200;
    private static final int MAX_TILE_WIDTH = MosaicLayout.MAX_WIDTH - 2 * MosaicLayout.GAP;
    private static final double[] SCALES = {2, 3, 3, 3};

    @Override
    public Mosaic build(Path validatedImage, List<int[]> crops) {
        BufferedImage page;
        try { page = ImageIO.read(validatedImage.toFile()); }
        catch (IOException | RuntimeException unreadable) { return null; }
        if (page == null || crops.isEmpty()) return null;
        var tiles = new ArrayList<BufferedImage>();
        for (var crop : crops) {
            int left = Math.clamp(crop[0], 0, page.getWidth()), top = Math.clamp(crop[1], 0, page.getHeight());
            int right = Math.clamp(crop[2], 0, page.getWidth()), bottom = Math.clamp(crop[3], 0, page.getHeight());
            if (right - left < 2 || bottom - top < 2) {
                for (int v = 0; v < VARIANTS; v++) tiles.add(null);
                continue;
            }
            var source = page.getSubimage(left, top, right - left, bottom - top);
            for (int v = 0; v < VARIANTS; v++) tiles.add(variant(source, v));
        }
        var sizes = tiles.stream().map(tile -> tile == null ? new int[]{0, 0} : new int[]{tile.getWidth(), tile.getHeight()}).toList();
        var layout = MosaicLayout.pack(sizes);
        var canvas = new BufferedImage(layout.width(), layout.height(), BufferedImage.TYPE_INT_RGB);
        var graphics = canvas.createGraphics();
        try {
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, canvas.getWidth(), canvas.getHeight());
            for (int i = 0; i < tiles.size(); i++) {
                var tile = layout.tiles().get(i);
                if (tile != null && tiles.get(i) != null) graphics.drawImage(tiles.get(i), tile.x(), tile.y(), null);
            }
        } finally { graphics.dispose(); }
        try (var out = new ByteArrayOutputStream()) {
            if (!ImageIO.write(canvas, "png", out)) return null;
            return new Mosaic(out.toByteArray(), layout);
        } catch (IOException failed) { return null; }
    }

    static BufferedImage variant(BufferedImage source, int variant) {
        // Enlarge, but never past the tile bounds (a huge crop is shrunk to fit instead).
        double fit = Math.min((double) MAX_TILE_WIDTH / source.getWidth(), (double) MAX_TILE_HEIGHT / source.getHeight());
        double scale = Math.min(SCALES[variant], fit);
        var enlarged = scale(source, scale);
        return switch (variant) {
            case 0, 1 -> enlarged;
            case 2 -> thin(binarize(enlarged));
            default -> stretch(enlarged);
        };
    }

    static BufferedImage scale(BufferedImage source, double scale) {
        int width = Math.max(1, (int) Math.round(source.getWidth() * scale));
        int height = Math.max(1, (int) Math.round(source.getHeight() * scale));
        var target = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        var graphics = target.createGraphics();
        try {
            graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, width, height);
            graphics.drawImage(source, 0, 0, width, height, null);
        } finally { graphics.dispose(); }
        return target;
    }

    /** Grayscale + Otsu threshold: black ink on white, whatever the screentone or paper tint. */
    static BufferedImage binarize(BufferedImage source) {
        int width = source.getWidth(), height = source.getHeight();
        var gray = new int[width * height];
        var histogram = new int[256];
        for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) {
            int rgb = source.getRGB(x, y);
            int value = (int) Math.round(.299 * ((rgb >> 16) & 255) + .587 * ((rgb >> 8) & 255) + .114 * (rgb & 255));
            gray[y * width + x] = value;
            histogram[value]++;
        }
        int threshold = otsu(histogram, gray.length);
        var target = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        for (int i = 0; i < gray.length; i++) target.setRGB(i % width, i / width, gray[i] <= threshold ? 0x000000 : 0xffffff);
        return target;
    }

    static int otsu(int[] histogram, int total) {
        double sum = 0;
        for (int i = 0; i < 256; i++) sum += i * (double) histogram[i];
        double sumBackground = 0, best = -1;
        int weightBackground = 0, threshold = 127;
        for (int i = 0; i < 256; i++) {
            weightBackground += histogram[i];
            if (weightBackground == 0) continue;
            int weightForeground = total - weightBackground;
            if (weightForeground == 0) break;
            sumBackground += i * (double) histogram[i];
            double meanBackground = sumBackground / weightBackground;
            double meanForeground = (sum - sumBackground) / weightForeground;
            double between = (double) weightBackground * weightForeground * Math.pow(meanBackground - meanForeground, 2);
            if (between > best) { best = between; threshold = i; }
        }
        return threshold;
    }

    /** One-pixel erosion of black strokes: a pixel stays ink only when its whole 3x3 neighbourhood is ink. */
    static BufferedImage thin(BufferedImage binary) {
        int width = binary.getWidth(), height = binary.getHeight();
        var target = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) {
            boolean ink = true;
            for (int dy = -1; dy <= 1 && ink; dy++) for (int dx = -1; dx <= 1 && ink; dx++) {
                int nx = Math.clamp(x + dx, 0, width - 1), ny = Math.clamp(y + dy, 0, height - 1);
                ink = (binary.getRGB(nx, ny) & 0xffffff) == 0;
            }
            target.setRGB(x, y, ink ? 0x000000 : 0xffffff);
        }
        return target;
    }

    /** Grayscale with the darkest pixel mapped to black and the lightest to white. */
    static BufferedImage stretch(BufferedImage source) {
        int width = source.getWidth(), height = source.getHeight(), low = 255, high = 0;
        var gray = new int[width * height];
        for (int y = 0; y < height; y++) for (int x = 0; x < width; x++) {
            int rgb = source.getRGB(x, y);
            int value = (int) Math.round(.299 * ((rgb >> 16) & 255) + .587 * ((rgb >> 8) & 255) + .114 * (rgb & 255));
            gray[y * width + x] = value;
            low = Math.min(low, value); high = Math.max(high, value);
        }
        var target = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        for (int i = 0; i < gray.length; i++) {
            int value = Math.clamp((gray[i] - low) * 255 / Math.max(1, high - low), 0, 255);
            target.setRGB(i % width, i / width, value * 0x010101);
        }
        return target;
    }
}
