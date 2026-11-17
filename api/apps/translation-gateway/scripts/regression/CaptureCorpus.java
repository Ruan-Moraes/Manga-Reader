import com.google.cloud.vision.v1.AnnotateImageRequest;
import com.google.cloud.vision.v1.BatchAnnotateImagesRequest;
import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.Feature;
import com.google.cloud.vision.v1.Image;
import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.cloud.vision.v1.ImageAnnotatorSettings;
import com.google.cloud.vision.v1.ImageContext;
import com.google.protobuf.ByteString;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.layout.BubbleDeduplicator;
import com.toonlira.translationgateway.domain.layout.Detections;
import com.toonlira.translationgateway.domain.layout.LayoutGeometry;
import com.toonlira.translationgateway.domain.layout.LayoutParameters;
import com.toonlira.translationgateway.domain.layout.PixelImage;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.infrastructure.layout.OnnxBubbleDetector;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import javax.imageio.ImageIO;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;

/**
 * Freezes the inputs of the regression gate for every page of the validation corpus
 * (web/apps/gateway-tester/corpus/corpus.json), written under src/test/resources:
 *   corpus-replay/<chapter>/<page>.vision.pb       Cloud Vision DOCUMENT_TEXT_DETECTION response (PAID, once per page)
 *   corpus-replay/<chapter>/<page>.detections.json balloon/text detector output (local ONNX model, free)
 *   visual-regression/corpus/<chapter>-<page>.json render fixture: regions and frozen translations of a batch
 *                                                   manifest + detector balloons and classes (only with a batch)
 * Existing .vision.pb files are never requested again. Usage (see capture-corpus.sh):
 *   CaptureCorpus <corpusDir> <detector.onnx> <gcpProject> [<batchDir>]
 */
void main(String[] args) throws Exception {
    var corpus = Path.of(args[0]);
    var model = Path.of(args[1]);
    var project = args[2];
    var batch = args.length > 3 ? Path.of(args[3]) : null;
    var resources = Path.of("src/test/resources");
    var mapper = GatewayJsonMapper.create();
    var manifest = mapper.readTree(Files.readAllBytes(corpus.resolve("corpus.json")));
    int paid = 0, fixtures = 0;
    ImageAnnotatorClient client = null;
    try (var detector = new OnnxBubbleDetector(model)) {
        for (var chapter : manifest.path("chapters")) {
            var id = chapter.path("id").asText();
            var language = chapter.path("sourceLanguage").asText();
            var out = resources.resolve("corpus-replay").resolve(id);
            Files.createDirectories(out);
            for (var page : chapter.path("pages")) {
                var file = page.path("file").asText();
                var base = file.replaceFirst("\\.[^.]+$", "");
                var image = corpus.resolve(id).resolve(file);
                var pixels = ImageIO.read(image.toFile());
                int w = pixels.getWidth(), h = pixels.getHeight();

                var vision = out.resolve(base + ".vision.pb");
                if (!Files.exists(vision)) {
                    if (client == null) client = ImageAnnotatorClient.create(
                        ImageAnnotatorSettings.newBuilder().setEndpoint("us-vision.googleapis.com:443").build());
                    var request = BatchAnnotateImagesRequest.newBuilder().setParent("projects/" + project + "/locations/us")
                        .addRequests(AnnotateImageRequest.newBuilder()
                            .setImage(Image.newBuilder().setContent(ByteString.copyFrom(Files.readAllBytes(image))))
                            .addFeatures(Feature.newBuilder().setType(Feature.Type.DOCUMENT_TEXT_DETECTION))
                            .setImageContext(ImageContext.newBuilder().addLanguageHints(language))).build();
                    BatchAnnotateImagesResponse response = client.batchAnnotateImages(request);
                    Files.write(vision, response.toByteArray());
                    paid++;
                }

                PixelImage px = new PixelImage() {
                    public int width() { return w; }
                    public int height() { return h; }
                    public int rgb(int x, int y) { return pixels.getRGB(x, y); }
                };
                // Same filtering as ShadowLayoutService.detectForGrouping; a failed detection is recorded as such, since
                // the worker then groups by proximity without balloons.
                Detections detections;
                ObjectNode detectionsNode;
                try {
                    var detected = detector.detectAll(px, Duration.ofSeconds(60));
                    detections = new Detections(BubbleDeduplicator.filter(detected.bubbles()).retained(), detected.texts());
                    detectionsNode = detectionsJson(mapper, detections);
                } catch (com.toonlira.translationgateway.domain.layout.LayoutFailure failure) {
                    detections = new Detections(java.util.List.of(), java.util.List.of());
                    detectionsNode = mapper.createObjectNode().put("failed", failure.getMessage());
                }
                Files.writeString(out.resolve(base + ".detections.json"),
                    mapper.writerWithDefaultPrettyPrinter().writeValueAsString(detectionsNode) + "\n");

                var rendered = batch == null ? null : batch.resolve(id).resolve(base + ".manifest.json");
                if (rendered != null && Files.exists(rendered)) {
                    var fixture = fixture(mapper, mapper.readTree(Files.readAllBytes(rendered)), detections, id + "/" + file, language, w, h);
                    var target = resources.resolve("visual-regression/corpus").resolve(id + "-" + base + ".json");
                    Files.createDirectories(target.getParent());
                    Files.writeString(target, mapper.writerWithDefaultPrettyPrinter().writeValueAsString(fixture) + "\n");
                    fixtures++;
                }
                System.out.println(id + "/" + file + " bubbles=" + detections.bubbles().size() + " texts=" + detections.texts().size());
            }
        }
    } finally {
        if (client != null) client.close();
    }
    System.out.println("vision calls=" + paid + " render fixtures=" + fixtures);
}

ObjectNode detectionsJson(tools.jackson.databind.ObjectMapper mapper, Detections detections) {
    var root = mapper.createObjectNode();
    var bubbles = root.putArray("bubbles");
    for (var b : detections.bubbles()) {
        var node = bubbles.addObject();
        node.put("id", b.id());
        node.put("confidence", b.confidence());
        box(node.putArray("box"), b.bounds().left(), b.bounds().top(), b.bounds().right(), b.bounds().bottom());
    }
    var texts = root.putArray("texts");
    for (var t : detections.texts()) {
        var node = texts.addObject();
        node.put("id", t.id());
        node.put("kind", t.kind().name());
        node.put("confidence", t.confidence());
        box(node.putArray("box"), t.bounds().left(), t.bounds().top(), t.bounds().right(), t.bounds().bottom());
    }
    return root;
}

void box(tools.jackson.databind.node.ArrayNode array, double... values) {
    for (var v : values) array.add(v);
}

/** Same shape and region-class rule as .local/bench/CaptureFixture (LayoutInterpreter's text-kind coverage). */
ObjectNode fixture(tools.jackson.databind.ObjectMapper mapper, JsonNode rendered, Detections detections, String page,
                   String language, int w, int h) {
    var out = mapper.createObjectNode();
    out.put("root", "corpus");
    out.put("page", page);
    out.put("sourceLanguage", language);
    out.put("width", w);
    out.put("height", h);
    var regions = out.putArray("regions");
    for (var r : rendered.path("regions")) {
        var polygon = new ArrayList<OcrManifest.Vertex>();
        for (var v : r.path("polygon")) polygon.add(new OcrManifest.Vertex(v.path("x").asDouble(), v.path("y").asDouble()));
        String kind = "unknown";
        double best = LayoutParameters.TEXT_KIND_COVERAGE;
        for (var t : detections.texts()) {
            double cover = LayoutGeometry.containment(polygon, t.bounds());
            if (cover >= best) { best = cover; kind = t.kind().name(); }
        }
        var node = regions.addObject();
        node.put("source", r.path("sourceText").asText());
        node.put("translation", r.path("translatedText").asText());
        node.put("kind", kind);
        var poly = node.putArray("polygon");
        for (var v : polygon) { var p = poly.addArray(); p.add(v.x()); p.add(v.y()); }
    }
    var boxes = out.putArray("bubbles");
    for (var b : detections.bubbles()) box(boxes.addArray(), b.bounds().left(), b.bounds().top(), b.bounds().right(), b.bounds().bottom());
    return out;
}
