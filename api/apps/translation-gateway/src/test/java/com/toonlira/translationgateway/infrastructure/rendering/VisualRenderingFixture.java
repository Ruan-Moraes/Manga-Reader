package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.SupportedLanguages;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import java.awt.Color;
import java.awt.geom.Path2D;
import java.awt.image.BufferedImage;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/** Generated diagnostic artwork/text, not licensed samples, provider output or a linguistic reference. */
final class VisualRenderingFixture {
    static final int WIDTH = 1200, HEIGHT = 900;
    private static final int PAPER = 0xffd7d7d7, DARK = 0xff303030;
    private static final int OVERFLOW_REPETITIONS = 100;
    private VisualRenderingFixture() { }

    static String text(String language) {
        if (!SupportedLanguages.contains(language)) throw new IllegalArgumentException("visual-fixture-invalid");
        return switch (language) {
            case "ja" -> "日本語の漫画。こんにちは！";
            case "en" -> "Hello, reader!";
            case "es" -> "¡Hola! ¿Cómo estás?";
            case "ko" -> "한국어 만화 안녕하세요!";
            case "zh-Hans" -> "简体中文漫画阅读顺序。";
            case "zh-Hant" -> "繁體中文漫畫閱讀順序。";
            case "pt-BR" -> "Olá! Ação e coração.";
            default -> throw new IllegalArgumentException("visual-fixture-invalid");
        };
    }

    static RenderRequest request(RenderSource source, String language) {
        String value = text(language);
        var job = UUID.nameUUIDFromBytes(("synthetic-visual-render:" + language).getBytes(StandardCharsets.UTF_8));
        var pair = new LanguagePair(language.equals("en") ? "pt-BR" : "en", language);
        var polygons = polygons();
        var regions = new ArrayList<OcrManifest.Region>(polygons.size());
        for (int index = 0; index < polygons.size(); index++)
            regions.add(new OcrManifest.Region(new UUID(0, index + 1), index, "SYNTHETIC SOURCE " + index, polygons.get(index)));
        var texts = List.of(value, value + "\n<>& \" ' — " + value, value, value.repeat(OVERFLOW_REPETITIONS));
        var ocr = new OcrManifest("1.0", job, pair.source(), source.widthPx(), source.heightPx(), regions);
        var input = new TranslationRequest(job, pair, regions.stream().map(region ->
            new TranslationRequest.Region(region.id(), region.readingOrder(), region.sourceText())).toList());
        var response = new TranslationResponse(regions.stream().map(region ->
            new TranslationResponse.Region(region.id(), texts.get(region.readingOrder()))).toList());
        var validated = new TranslationValidator(Set.of(pair)).validateResponse(input, response);
        // Binding markers are explicitly synthetic, not hashes of captured provider artifacts.
        return RenderRequest.create(source, ocr, validated, "b".repeat(64), "c".repeat(64), RenderPolicy.initial());
    }

    static BufferedImage image() {
        var image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_ARGB);
        var graphics = image.createGraphics();
        try {
            graphics.setColor(new Color(PAPER, true)); graphics.fillRect(0, 0, WIDTH, HEIGHT);
            graphics.setColor(Color.GRAY);
            for (int x = 0; x < WIDTH; x += 40) graphics.drawLine(x, 0, x, HEIGHT);
            graphics.setColor(Color.WHITE); graphics.fillRect(50, 50, 550, 230);
            graphics.setColor(new Color(DARK, true)); graphics.fillRect(620, 50, 530, 300);
            graphics.setColor(Color.WHITE); graphics.fillOval(60, 350, 520, 400);
            graphics.fillRect(700, 460, 60, 250);
            for (int index = 0; index < polygons().size(); index++) {
                var shape = shape(polygons().get(index));
                graphics.setClip(shape);
                graphics.setColor(index == 1 ? Color.WHITE : Color.BLACK);
                var bounds = shape.getBounds();
                for (int y = bounds.y + 20; y < bounds.y + bounds.height - 10; y += 35)
                    graphics.fillRect(bounds.x + 3, y, Math.max(1, bounds.width - 6), 6);
            }
        } finally { graphics.dispose(); }
        return image;
    }

    static List<List<OcrManifest.Vertex>> polygons() {
        return List.of(rectangle(.07, .08, .47, .25), rectangle(.53, .08, .93, .33),
            List.of(new OcrManifest.Vertex(.23, .42), new OcrManifest.Vertex(.43, .58),
                new OcrManifest.Vertex(.23, .75), new OcrManifest.Vertex(.07, .58)),
            rectangle(.60, .55, .62, .75));
    }
    static Path2D.Double shape(List<OcrManifest.Vertex> polygon) {
        var shape = new Path2D.Double(); shape.moveTo(polygon.getFirst().x() * WIDTH, polygon.getFirst().y() * HEIGHT);
        for (int index = 1; index < polygon.size(); index++) shape.lineTo(polygon.get(index).x() * WIDTH, polygon.get(index).y() * HEIGHT);
        shape.closePath(); return shape;
    }
    private static List<OcrManifest.Vertex> rectangle(double left, double top, double right, double bottom) {
        return List.of(new OcrManifest.Vertex(left, top), new OcrManifest.Vertex(right, top),
            new OcrManifest.Vertex(right, bottom), new OcrManifest.Vertex(left, bottom));
    }
}
