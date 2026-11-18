package com.toonlira.translationgateway.evaluation;

import static org.assertj.core.api.Assertions.assertThat;

import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.layout.LayoutBox;
import com.toonlira.translationgateway.domain.ocr.OcrAssembly;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.infrastructure.ocr.ClasspathLexicons;
import com.toonlira.translationgateway.infrastructure.ocr.VisionResponseMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;
import javax.imageio.ImageIO;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import tools.jackson.databind.JsonNode;

/**
 * Regression gate of the OCR stage over the validation corpus (web/apps/gateway-tester/corpus, versioned): a frozen
 * Cloud Vision response and detector output per page (captured once by scripts/regression/capture-corpus.sh) go
 * through the same assembly as the worker ({@link OcrAssembly}) — no provider, no model, no cost. The resulting
 * regions (text and box) must match {@code <page>.regions.json}. Paid re-reading is not replayed.
 * {@code UPDATE_VISUAL_FIXTURES=1} records the current regions as the new baseline: review that diff in the commit.
 */
class CorpusOcrReplayTest {
    private static final Path REPLAY = Path.of("src/test/resources/corpus-replay");
    static final Path CORPUS = Path.of("../../../web/apps/gateway-tester/corpus");
    private static final UUID JOB = new UUID(0, 1);

    static Stream<Path> pages() throws Exception {
        try (var files = Files.walk(REPLAY)) {
            return files.filter(f -> f.toString().endsWith(".vision.pb")).sorted().toList().stream();
        }
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("pages")
    void corpusPageKeepsItsRegions(Path vision) throws Exception {
        var mapper = GatewayJsonMapper.create();
        var chapterId = vision.getParent().getFileName().toString();
        var base = vision.getFileName().toString().replace(".vision.pb", "");
        var chapter = chapter(mapper, chapterId);
        var language = chapter.path("sourceLanguage").asText();
        var image = ImageIO.read(CORPUS.resolve(chapterId).resolve(file(chapter, base)).toFile());
        int w = image.getWidth(), h = image.getHeight();

        var response = BatchAnnotateImagesResponse.parseFrom(Files.readAllBytes(vision));
        var read = new VisionResponseMapper().mapParagraphs(response, new OcrPort.Command("replay", language, JOB, w, h));
        var detections = mapper.readTree(Files.readAllBytes(vision.resolveSibling(base + ".detections.json")));
        List<LayoutBox> bubbles = null;
        var texts = new ArrayList<com.toonlira.translationgateway.domain.layout.TextBox>();
        for (var t : detections.path("texts")) {
            var box = t.path("box");
            texts.add(new com.toonlira.translationgateway.domain.layout.TextBox(t.path("id").asText(),
                com.toonlira.translationgateway.domain.layout.TextBox.Kind.valueOf(t.path("kind").asText()),
                new LayoutBox(box.get(0).asDouble(), box.get(1).asDouble(), box.get(2).asDouble(), box.get(3).asDouble()),
                t.path("confidence").asDouble()));
        }
        if (!detections.has("failed")) {
            bubbles = new ArrayList<>();
            for (var b : detections.path("bubbles")) {
                var box = b.path("box");
                bubbles.add(new LayoutBox(box.get(0).asDouble(), box.get(1).asDouble(), box.get(2).asDouble(), box.get(3).asDouble()));
            }
        }
        var regions = OcrAssembly.finish(OcrAssembly.fitTextBoxes(OcrAssembly.group(read, bubbles, language, w, h), texts), language,
            new ClasspathLexicons().forLanguage(language));

        var observed = mapper.createArrayNode();
        for (var region : regions) {
            var node = observed.addObject();
            node.put("text", region.sourceText());
            var box = node.putArray("box");
            for (double v : bounds(region)) box.add(Math.round(v * 10000) / 10000.0);
        }
        var baseline = vision.resolveSibling(base + ".regions.json");
        if (System.getenv("UPDATE_VISUAL_FIXTURES") != null) {
            Files.writeString(baseline, mapper.writerWithDefaultPrettyPrinter().writeValueAsString(observed) + "\n");
            return;
        }
        assertThat(Files.exists(baseline)).as("no baseline: record with UPDATE_VISUAL_FIXTURES=1").isTrue();
        var expected = mapper.readTree(Files.readAllBytes(baseline));
        assertThat(texts(observed)).as("region texts of " + chapterId + "/" + base).isEqualTo(texts(expected));
        assertThat(observed).as("region boxes of " + chapterId + "/" + base).isEqualTo(expected);
    }

    static JsonNode chapter(tools.jackson.databind.ObjectMapper mapper, String id) throws Exception {
        for (var chapter : mapper.readTree(Files.readAllBytes(CORPUS.resolve("corpus.json"))).path("chapters"))
            if (chapter.path("id").asText().equals(id)) return chapter;
        throw new IllegalStateException("chapter not in corpus.json: " + id);
    }

    private static String file(JsonNode chapter, String base) {
        for (var page : chapter.path("pages")) {
            var file = page.path("file").asText();
            if (file.replaceFirst("\\.[^.]+$", "").equals(base)) return file;
        }
        throw new IllegalStateException("page not in corpus.json: " + base);
    }

    private static List<String> texts(JsonNode regions) {
        var texts = new ArrayList<String>();
        for (var r : regions) texts.add(r.path("text").asText());
        return texts;
    }

    private static double[] bounds(OcrManifest.Region region) {
        double l = 1, t = 1, r = 0, b = 0;
        for (var v : region.polygon()) { l = Math.min(l, v.x()); r = Math.max(r, v.x()); t = Math.min(t, v.y()); b = Math.max(b, v.y()); }
        return new double[]{l, t, r, b};
    }
}
