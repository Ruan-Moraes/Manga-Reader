package com.toonlira.translationgateway.evaluation;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;
import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.BoundingPoly;
import com.google.cloud.vision.v1.Paragraph;
import com.google.cloud.vision.v1.TextAnnotation.TextProperty;
import com.google.protobuf.Message;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.domain.OcrGeometry;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.infrastructure.ocr.VisionResponseMapper;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.UUID;

/** Offline test tooling: protobuf messages and pure mapper only, never clients or Spring. */
public final class VisionDiagnostic {
    private static final int MAX_RAW = 4 * 1024 * 1024;
    private static final int MAX_JSON = 16 * 1024 * 1024;
    private static final int MAX_NODES = 100_000;
    private static final ObjectMapper JSON = GatewayJsonMapper.create();

    public static ObjectNode inspect(byte[] raw, OcrManifest saved) throws Exception {
        require(raw.length <= MAX_RAW && "1.0".equals(saved.version()));
        var batch = BatchAnnotateImagesResponse.parseFrom(raw);
        var command = new OcrPort.Command("local-diagnostic", saved.sourceLanguage(), saved.jobRef(), saved.widthPx(), saved.heightPx());
        var mapped = new VisionResponseMapper().map(batch, command);
        require(mapped.equals(saved.regions()));
        var result = JSON.createObjectNode();
        result.put("diagnosticVersion", "1.0").put("parserRevision", "vision-structure-1")
            .put("mapperReplayExactlyMatches", true).put("widthPx", saved.widthPx()).put("heightPx", saved.heightPx())
            .put("javaVersion", System.getProperty("java.version"));
        var nodes = result.putArray("nodes");
        var pages = batch.getResponses(0).getFullTextAnnotation().getPagesList();
        for (int p = 0; p < pages.size(); p++) {
            var page = pages.get(p);
            var pagePath = Integer.toString(p);
            node(nodes, pagePath, "", "page", page, null, null, saved);
            for (int b = 0; b < page.getBlocksCount(); b++) {
                var block = page.getBlocks(b);
                var blockPath = pagePath + "/" + b;
                node(nodes, blockPath, pagePath, "block", block, block.getBoundingBox(), block.getProperty(), saved)
                    .put("blockType", block.getBlockType().name());
                for (int r = 0; r < block.getParagraphsCount(); r++) {
                    var paragraph = block.getParagraphs(r);
                    var path = blockPath + "/" + r;
                    var entry = node(nodes, path, blockPath, "paragraph", paragraph, paragraph.getBoundingBox(), paragraph.getProperty(), saved);
                    // Match structural IDs, not array indexes after filtering or text equality.
                    var identity = saved.jobRef() + ":vision:" + p + ":" + b + ":" + r;
                    var id = UUID.nameUUIDFromBytes(identity.getBytes(StandardCharsets.UTF_8));
                    var region = mapped.stream().filter(value -> value.id().equals(id)).findFirst();
                    entry.put("structuralRegionId", id.toString());
                    if (region.isPresent()) {
                        entry.put("regionId", id.toString()).put("readingOrder", region.get().readingOrder()).put("disposition", "retained");
                    } else entry.putNull("regionId").putNull("readingOrder").put("disposition", discardedReason(paragraph, command));
                    for (int w = 0; w < paragraph.getWordsCount(); w++) {
                        var word = paragraph.getWords(w);
                        var wordPath = path + "/" + w;
                        node(nodes, wordPath, path, "word", word, word.getBoundingBox(), word.getProperty(), saved);
                        for (int s = 0; s < word.getSymbolsCount(); s++) {
                            var symbol = word.getSymbols(s);
                            node(nodes, wordPath + "/" + s, wordPath, "symbol", symbol, symbol.getBoundingBox(), symbol.getProperty(), saved)
                                .put("text", symbol.getText());
                        }
                    }
                }
            }
        }
        require(JSON.writeValueAsBytes(result).length <= MAX_JSON);
        return result;
    }

    private static String discardedReason(Paragraph paragraph, OcrPort.Command command) {
        var symbols = new StringBuilder();
        paragraph.getWordsList().forEach(word -> word.getSymbolsList().forEach(symbol -> symbols.append(symbol.getText())));
        if (symbols.toString().isBlank()) return "blank";
        if (!valid(paragraph.getBoundingBox(), command.widthPx(), command.heightPx())) return "invalid-geometry";
        // A valid nonblank paragraph absent from a successful full replay was an exact duplicate.
        return "duplicate";
    }

    private static ObjectNode node(ArrayNode nodes, String path, String parent, String kind, Message message,
                                   BoundingPoly box, TextProperty property, OcrManifest saved) {
        require(nodes.size() < MAX_NODES);
        var entry = nodes.addObject().put("path", path).put("parent", parent).put("kind", kind);
        entry.putNull("text");
        var confidence = message.getDescriptorForType().findFieldByName("confidence");
        // Proto3 implicit zero has no presence: do not turn an unspecified scalar into a quality score.
        if (confidence != null && message.getAllFields().containsKey(confidence)) {
            entry.put("confidence", ((Number) message.getField(confidence)).doubleValue());
        } else entry.putNull("confidence");
        if (property != null && property.hasDetectedBreak()) {
            entry.putObject("detectedBreak").put("type", property.getDetectedBreak().getType().name())
                .put("isPrefix", property.getDetectedBreak().getIsPrefix());
        } else entry.putNull("detectedBreak");
        var vertices = entry.putArray("vertices");
        var normalized = entry.putArray("normalizedVertices");
        if (box != null) {
            box.getVerticesList().forEach(v -> vertices.addObject().put("x", v.getX()).put("y", v.getY()));
            box.getNormalizedVerticesList().forEach(v -> normalized.addObject().put("x", v.getX()).put("y", v.getY()));
        }
        boolean valid = box != null && valid(box, saved.widthPx(), saved.heightPx());
        entry.put("geometry", valid ? "valid" : vertices.isEmpty() && normalized.isEmpty() ? "missing" : "invalid");
        String aspect = "unknown";
        if (valid) {
            var xs = box.getVerticesList().stream().mapToInt(v -> v.getX()).summaryStatistics();
            var ys = box.getVerticesList().stream().mapToInt(v -> v.getY()).summaryStatistics();
            int width = xs.getMax() - xs.getMin(), height = ys.getMax() - ys.getMin();
            aspect = width > height ? "wide" : height > width ? "tall" : "square";
        }
        return entry.put("aspectHint", aspect);
    }

    private static boolean valid(BoundingPoly box, int width, int height) {
        return box.getVerticesCount() == 4 && box.getNormalizedVerticesCount() == 0 && OcrGeometry.valid(
            box.getVerticesList().stream().map(v -> new OcrManifest.Vertex((double) v.getX() / width, (double) v.getY() / height)).toList());
    }

    private static byte[] read(Path path, int max) throws Exception {
        require(Files.isRegularFile(path, LinkOption.NOFOLLOW_LINKS) && Files.size(path) <= max);
        return Files.readAllBytes(path);
    }
    private static String hash(byte[] bytes) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }
    private static void require(boolean condition) {
        if (!condition) throw new IllegalArgumentException("diagnostic-invalid-artifact");
    }

    public static void main(String[] args) {
        try {
            require(args.length == 4);
            var run = Path.of(args[0]);
            var raw = read(run.resolve("vision-response.pb"), MAX_RAW);
            var manifest = read(run.resolve("manifest.json"), 1024 * 1024);
            require(hash(raw).equals(args[2]) && hash(manifest).equals(args[3]));
            var diagnostic = inspect(raw, JSON.readValue(manifest, OcrManifest.class));
            var bytes = JSON.writeValueAsBytes(diagnostic);
            require(bytes.length <= MAX_JSON);
            var output = Path.of(args[1]);
            Files.createFile(output, PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")));
            Files.write(output, bytes, StandardOpenOption.WRITE);
        } catch (Exception ignored) {
            System.err.println("diagnostic-invalid-artifact");
            System.exit(1);
        }
    }
}
