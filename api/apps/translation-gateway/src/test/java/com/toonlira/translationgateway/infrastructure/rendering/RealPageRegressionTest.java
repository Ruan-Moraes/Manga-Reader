package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.layout.LayoutBox;
import com.toonlira.translationgateway.domain.rendering.CaptionFilter;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.infrastructure.ocr.ClasspathLexicons;
import java.awt.Rectangle;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import javax.imageio.ImageIO;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;

/**
 * Visual regression on real pages (Ubunchu!, CC BY-NC-SA — the images stay outside the repository, see
 * docs/rendering/visual-regression.md). Each fixture in {@code src/test/resources/visual-regression} freezes the inputs
 * of the render (texts, translations, polygons, balloons, detector classes) and the expectations per region:
 * overflow, a font floor, source ink left beside the new text, and pixels changed outside balloons and text boxes.
 * Ubunchu! fixtures run only where the samples exist ({@code TOONLIRA_SAMPLES}, default
 * {@code ~/Documentos/Projetos/toonlira-samples}); fixtures under {@code visual-regression/corpus} use the versioned
 * validation corpus and always run (captured by scripts/regression/capture-corpus.sh from a batch).
 * {@code UPDATE_VISUAL_FIXTURES=1} records the current render as the new expectations (review the diff).
 */
class RealPageRegressionTest {
    private static final BundledRenderingFonts FONTS = new BundledRenderingFonts();
    private static final Path FIXTURES = Path.of("src/test/resources/visual-regression");
    private static final Path CORPUS = Path.of("../../../web/apps/gateway-tester/corpus");
    private static final double FONT_TOLERANCE = .85, INK_TOLERANCE = 1.1;
    private static final int INK_SLACK = 20, OUTSIDE_SLACK = 50;

    static Stream<Path> fixtures() throws Exception {
        try (var files = Files.walk(FIXTURES)) { return files.filter(f -> f.toString().endsWith(".json")).sorted().toList().stream(); }
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("fixtures")
    void realPageMeetsItsExpectations(Path fixture) throws Exception {
        var samples = Path.of(System.getenv().getOrDefault("TOONLIRA_SAMPLES",
            System.getProperty("user.home") + "/Documentos/Projetos/toonlira-samples"));
        var mapper = GatewayJsonMapper.create();
        var root = (ObjectNode) mapper.readTree(Files.readAllBytes(fixture));
        // "root": "corpus" — page of the versioned validation corpus (web/apps/gateway-tester/corpus), always available.
        var file = ("corpus".equals(root.path("root").asText()) ? CORPUS : samples).resolve(root.path("page").asText());
        assumeTrue(Files.isRegularFile(file), "sample page not available");
        var original = ImageIO.read(file.toFile());
        var image = RegionChecks.copy(original);
        int w = image.getWidth(), h = image.getHeight();
        var texts = new ArrayList<RegionChecks.Text>();
        var kinds = new HashMap<UUID, String>();
        int index = 0;
        for (var region : root.path("regions")) {
            var polygon = new ArrayList<OcrManifest.Vertex>();
            for (var vertex : region.path("polygon")) polygon.add(new OcrManifest.Vertex(vertex.get(0).asDouble(), vertex.get(1).asDouble()));
            texts.add(new RegionChecks.Text(region.path("source").asText(), region.path("translation").asText(), polygon));
            kinds.put(new UUID(0, ++index), region.path("kind").asText());
        }
        var bubbles = new ArrayList<LayoutBox>();
        for (var box : root.path("bubbles")) bubbles.add(new LayoutBox(box.get(0).asDouble(), box.get(1).asDouble(), box.get(2).asDouble(), box.get(3).asDouble()));
        var language = root.path("sourceLanguage").asText();
        var request = RegionChecks.request(image, language, texts).withBubbles(bubbles);
        // Same hints as production: CaptionFilter on the detector classes (unknown never inpainted).
        var lexicon = new ClasspathLexicons().forLanguage(language);
        request = request.withCaptionHints(CaptionFilter.captions(request, lexicon, kinds))
            .withLetteringHints(CaptionFilter.letterings(request, lexicon, kinds))
            .withDrawnHints(CaptionFilter.drawn(request, lexicon, kinds));
        // Deterministic stand-in for LaMa (the real model is not part of the regression): the box is filled with the
        // median colour of the ring just outside it, as the model rebuilds plain paper.
        Inpainter white = (raster, box, quad) -> {
            int fill = RegionChecks.ringMedian(raster, box);
            for (int y = Math.max(0, box[1]); y < Math.min(h, box[3]); y++)
                for (int x = Math.max(0, box[0]); x < Math.min(w, box[2]); x++) raster.setRGB(x, y, fill);
            return true;
        };
        var before = RegionChecks.copy(original);
        var placements = new PageRasterPainter(FONTS, white).paint(image, request);
        // The worker turns the placements into the render manifest: what it rejects fails the page in production.
        com.toonlira.translationgateway.domain.rendering.RenderManifest.create(request,
            new com.toonlira.translationgateway.domain.rendering.RenderedImage("image/webp", 1, w, h, "0".repeat(64)), placements);
        // DUMP_VISUAL=<dir>: save the render to look at it (diagnostics only).
        var dump = System.getenv("DUMP_VISUAL");
        if (dump != null) ImageIO.write(image, "png", Path.of(dump).resolve(fixture.getFileName().toString().replace(".json", ".png")).toFile());

        var allowed = new ArrayList<Rectangle>();
        for (var b : bubbles) {
            double dx = (b.right() - b.left()) * .15, dy = (b.bottom() - b.top()) * .15;
            allowed.add(new Rectangle((int) ((b.left() - dx) * w), (int) ((b.top() - dy) * h), (int) ((b.right() - b.left() + 2 * dx) * w) + 1,
                (int) ((b.bottom() - b.top() + 2 * dy) * h) + 1));
        }
        var regionBoxes = new ArrayList<Rectangle>();
        for (var text : texts) {
            var box = RegionChecks.bounds(text.polygon(), w, h);
            regionBoxes.add(box);
            var grown = new Rectangle(box); grown.grow(14, 14); allowed.add(grown);
        }
        int outside = RegionChecks.changedOutside(before, image, allowed);
        var observed = new ArrayList<int[]>();
        for (int i = 0; i < placements.size(); i++) {
            var placement = placements.get(i);
            int residual = placement.overflow() ? 0 : RegionChecks.residualInk(before, image, regionBoxes.get(i));
            observed.add(new int[]{placement.overflow() ? 1 : 0, placement.fontSizePx(), residual});
        }

        if (System.getenv("UPDATE_VISUAL_FIXTURES") != null) {
            var expect = root.putObject("expect");
            expect.put("maxChangedOutside", outside);
            var regions = expect.putArray("regions");
            for (var values : observed) {
                var node = regions.addObject();
                node.put("overflow", values[0] == 1);
                node.put("font", values[1]);
                node.put("residualInk", values[2]);
            }
            Files.writeString(fixture, mapper.writerWithDefaultPrettyPrinter().writeValueAsString(root) + "\n");
            return;
        }
        JsonNode expect = root.path("expect");
        assertThat(expect.isMissingNode()).as("fixture has no expectations: record with UPDATE_VISUAL_FIXTURES=1").isFalse();
        assertThat(outside).as("pixels changed outside balloons and text boxes")
            .isLessThanOrEqualTo(expect.path("maxChangedOutside").asInt() + OUTSIDE_SLACK);
        var expected = expect.path("regions");
        assertThat(expected.size()).isEqualTo(observed.size());
        for (int i = 0; i < observed.size(); i++) {
            var e = expected.get(i);
            var values = observed.get(i);
            var label = "region " + i + " " + texts.get(i).source().strip();
            assertThat(values[0] == 1).as(label + " overflow").isEqualTo(e.path("overflow").asBoolean());
            if (values[0] == 1) continue;
            assertThat(values[1]).as(label + " font").isGreaterThanOrEqualTo((int) Math.floor(e.path("font").asInt() * FONT_TOLERANCE));
            assertThat(values[2]).as(label + " source ink left")
                .isLessThanOrEqualTo((int) Math.ceil(e.path("residualInk").asInt() * INK_TOLERANCE) + INK_SLACK);
        }
    }
}
