package com.toonlira.translationgateway.infrastructure.rendering;

import static org.junit.jupiter.api.Assumptions.assumeTrue;

import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.layout.LayoutBox;
import com.toonlira.translationgateway.domain.rendering.CaptionFilter;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.infrastructure.ocr.ClasspathLexicons;
import java.awt.geom.Path2D;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;

/**
 * Calibration probe, off by default ({@code LEFTOVER_PROBE=<out dir>}): runs the real LaMa on every fixture and
 * writes, per inpainted region, how much of the source ink inside the inpainting mask came back unchanged, plus
 * the renders. Its 2026-11-18 run is why there is no LEFTOVER_TEXT code (docs/rendering/rendering-contracts.md).
 */
class LeftoverCalibrationProbe {
    @Test
    void probe() throws Exception {
        var out = System.getenv("LEFTOVER_PROBE");
        assumeTrue(out != null);
        var model = Path.of(System.getProperty("user.dir")).resolve("../../../.local/inpainting/lama_fp32.onnx").normalize();
        var lama = new LamaInpainter(model, 4);
        var mapper = GatewayJsonMapper.create();
        var lines = new ArrayList<String>();
        var samples = Path.of(System.getProperty("user.home") + "/Documentos/Projetos/toonlira-samples");
        try (var files = Files.walk(Path.of("src/test/resources/visual-regression"))) {
            for (var fixture : files.filter(f -> f.toString().endsWith(".json")).sorted().toList()) {
                var root = mapper.readTree(Files.readAllBytes(fixture));
                var file = ("corpus".equals(root.path("root").asText()) ? Path.of("../../../web/apps/gateway-tester/corpus") : samples)
                    .resolve(root.path("page").asText());
                if (!Files.isRegularFile(file)) continue;
                var image = RegionChecks.copy(ImageIO.read(file.toFile()));
                var texts = new ArrayList<RegionChecks.Text>();
                var kinds = new HashMap<UUID, String>();
                int index = 0;
                for (var region : root.path("regions")) {
                    var polygon = new ArrayList<OcrManifest.Vertex>();
                    for (var v : region.path("polygon")) polygon.add(new OcrManifest.Vertex(v.get(0).asDouble(), v.get(1).asDouble()));
                    texts.add(new RegionChecks.Text(region.path("source").asText(), region.path("translation").asText(), polygon));
                    kinds.put(new UUID(0, ++index), region.path("kind").asText());
                }
                var bubbles = new ArrayList<LayoutBox>();
                for (var b : root.path("bubbles")) bubbles.add(new LayoutBox(b.get(0).asDouble(), b.get(1).asDouble(), b.get(2).asDouble(), b.get(3).asDouble()));
                var language = root.path("sourceLanguage").asText();
                var request = RegionChecks.request(image, language, texts).withBubbles(bubbles);
                var lexicon = new ClasspathLexicons().forLanguage(language);
                request = request.withCaptionHints(CaptionFilter.captions(request, lexicon, kinds))
                    .withLetteringHints(CaptionFilter.letterings(request, lexicon, kinds))
                    .withDrawnHints(CaptionFilter.drawn(request, lexicon, kinds));
                var name = fixture.getFileName().toString().replace(".json", "");
                Inpainter measured = (raster, box, quad) -> {
                    var window = InpaintWindow.prepare(raster, raster, box, 0, quad);
                    if (window == null) return lama.inpaint(raster, box, quad);
                    int l = window.left(), t = window.top(), r = window.right(), b = window.bottom(), wd = r - l;
                    var before = raster.getRGB(l, t, wd, b - t, null, 0, wd);
                    int ring = luma(RegionChecks.ringMedian(raster, box));
                    boolean ok = lama.inpaint(raster, box, quad);
                    int area = 0, ink = 0, kept = 0;
                    for (int y = t; y < b; y++) for (int x = l; x < r; x++) {
                        if (window.shape()[(y - t) * wd + x - l] == 0) continue;
                        area++;
                        int was = before[(y - t) * wd + x - l], now = raster.getRGB(x, y);
                        if (luma(was) >= Math.min(110, ring - 60)) continue;
                        ink++;
                        if (CleanBoxPainter.distance(was, now) < 40) kept++;
                    }
                    lines.add(String.format("%s\t%d,%d\tarea=%d\tink=%.3f\tkept/ink=%.3f\tkept=%.4f\tring=%d",
                        name, box[0], box[1], area, area == 0 ? 0 : (double) ink / area, ink == 0 ? 0 : (double) kept / ink,
                        area == 0 ? 0 : (double) kept / area, ring));
                    return ok;
                };
                new PageRasterPainter(new BundledRenderingFonts(), measured).paint(image, request);
                ImageIO.write(image, "png", Path.of(out).resolve(name + ".png").toFile());
            }
        }
        Files.write(Path.of(out).resolve("leftover.tsv"), lines);
    }

    private static int luma(int p) { return (299 * ((p >>> 16) & 255) + 587 * ((p >>> 8) & 255) + 114 * (p & 255)) / 1000; }
}
