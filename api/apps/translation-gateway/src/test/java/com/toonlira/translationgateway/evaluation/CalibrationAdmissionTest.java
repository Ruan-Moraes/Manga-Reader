package com.toonlira.translationgateway.evaluation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import tools.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class CalibrationAdmissionTest {
    @TempDir Path temporary;

    @Test void refusesTraversalAndUnknownOrientationBeforeReadingFiles() {
        var json = GatewayJsonMapper.create();
        var request = json.createObjectNode().put("version", "calibration-evaluation/1")
            .put("calibrationId", "../escape").put("orientation", "vertical");
        assertThatThrownBy(() -> CalibrationAdmission.admit(temporary, request)).isInstanceOf(Exception.class);
        request.put("calibrationId", "control").put("orientation", "diagonal");
        assertThatThrownBy(() -> CalibrationAdmission.admit(temporary, request)).isInstanceOf(Exception.class);
    }

    @Test void boundedReadsRejectSymlinksAndOversizedArtifacts() throws Exception {
        var file = temporary.resolve("file");
        Files.writeString(file, "12345");
        assertThat(CalibrationAdmission.read(file, 5)).hasSize(5);
        assertThatThrownBy(() -> CalibrationAdmission.read(file, 4)).isInstanceOf(Exception.class);
        var link = temporary.resolve("link"); Files.createSymbolicLink(link, file);
        assertThatThrownBy(() -> CalibrationAdmission.read(link, 5)).isInstanceOf(Exception.class);
    }

    @Test void admitsOnlyBoundReferenceImageAndMetadata() throws Exception {
        var request = fixture(temporary.toRealPath(), "control");
        var input = CalibrationAdmission.admit(temporary.toRealPath(), request);
        assertThat(input.sample().path("language").asText()).isEqualTo("ja");
        ((ObjectNode) request.path("sample")).put("language", "en");
        assertThatThrownBy(() -> CalibrationAdmission.admit(temporary.toRealPath(), request)).isInstanceOf(Exception.class);
    }

    @Test void rejectsChangedReferenceImageAndSourceManifest() throws Exception {
        var root = temporary.toRealPath();
        var request = fixture(root, "control");
        var reference = root.resolve("control/vertical-reference.json");
        Files.writeString(reference, "changed");
        assertThatThrownBy(() -> CalibrationAdmission.admit(root, request)).isInstanceOf(Exception.class);
        var other = fixture(root, "other");
        Files.writeString(root.resolve("other/vertical.png"), "changed");
        assertThatThrownBy(() -> CalibrationAdmission.admit(root, other)).isInstanceOf(Exception.class);
        var third = fixture(root, "third");
        ((ObjectNode) third.path("source")).put("bundleManifestSha256", "0".repeat(64));
        assertThatThrownBy(() -> CalibrationAdmission.admit(root, third)).isInstanceOf(Exception.class);
    }

    // Deliberately blank PNG and explicit fake reference: admission/integrity tests, never recognition evidence.
    static ObjectNode fixture(Path root, String id) throws Exception {
        return fixture(root, id, "kanji-grid-1", "kanji-grid-1", 0);
    }

    @Test void admitsWideRecipeButRejectsUnknownMismatchAndWrongCenters() throws Exception {
        var root = temporary.toRealPath();
        var wide = fixture(root, "wide", "kanji-grid-wide-1", "kanji-grid-wide-1", 0);
        assertThat(CalibrationAdmission.admit(root, wide).sample().path("language").asText()).isEqualTo("ja");
        var unknown = fixture(root, "unknown", "unknown", "unknown", 0);
        var mismatch = fixture(root, "mismatch", "kanji-grid-wide-1", "kanji-grid-1", 0);
        var shifted = fixture(root, "shifted", "kanji-grid-wide-1", "kanji-grid-wide-1", 1);
        for (var request : new ObjectNode[]{unknown, mismatch, shifted})
            assertThatThrownBy(() -> CalibrationAdmission.admit(root, request)).isInstanceOf(Exception.class);
    }

    private static ObjectNode fixture(Path root, String id, String revision, String manifestRevision, int shift) throws Exception {
        var json = CalibrationAdmission.JSON;
        var bundle = Files.createDirectory(root.resolve(id));
        var image = new BufferedImage(1200, 1200, BufferedImage.TYPE_INT_RGB);
        for (var name : new String[]{"horizontal", "vertical"}) ImageIO.write(image, "png", bundle.resolve(name + ".png").toFile());
        var text = "春夏秋冬山川草木日月星空東西南北";
        for (var name : new String[]{"horizontal", "vertical"}) {
            var ref = json.createObjectNode().put("referenceVersion", "1.0").put("recipeRevision", revision)
                .put("origin", "synthetic-typographic-control").put("orientation", name)
                .put("direction", name.equals("horizontal") ? "horizontal-ltr-ttb" : "vertical-ttb-rtl")
                .put("sequence", text).put("widthPx", 1200).put("heightPx", 1200)
                .put("imageSha256", CalibrationAdmission.hash(Files.readAllBytes(bundle.resolve(name + ".png"))));
            var tokens = ref.putArray("tokens");
            for (int i = 0; i < 16; i++) {
                int spacing = revision.equals("kanji-grid-wide-1") ? 336 : 220;
                int x = name.equals("horizontal") ? 208 + (i % 8) * 112 : 600 + spacing / 2 - (i / 8) * spacing;
                int y = name.equals("horizontal") ? 490 + (i / 8) * 220 : 208 + (i % 8) * 112;
                tokens.addObject().put("order", i).put("text", text.substring(i, i + 1)).putArray("centerPx").add(x + shift).add(y);
            }
            Files.write(bundle.resolve(name + "-reference.json"), json.writeValueAsBytes(ref));
        }
        Files.writeString(bundle.resolve("recipe.json"), "[]");
        Files.writeString(bundle.resolve("source.txt"), text);
        Files.writeString(bundle.resolve("simulation-tests.json"), "{}");
        var manifest = json.createObjectNode().put("calibrationVersion", "1.0").put("id", id).put("synthetic", true)
            .put("providerStatus", "not-executed").put("providerCalls", 0).put("credentialReads", 0).put("recipeRevision", manifestRevision);
        var records = manifest.putObject("files");
        for (var name : new String[]{"horizontal.png", "vertical.png", "horizontal-reference.json", "vertical-reference.json", "recipe.json", "source.txt", "simulation-tests.json"}) {
            var bytes = Files.readAllBytes(bundle.resolve(name)); records.putObject(name).put("bytes", bytes.length).put("sha256", CalibrationAdmission.hash(bytes));
        }
        var manifestBytes = json.writeValueAsBytes(manifest); Files.write(bundle.resolve("manifest.json"), manifestBytes);
        var request = json.createObjectNode().put("version", "calibration-evaluation/1").put("calibrationId", id).put("orientation", "vertical");
        var bytes = Files.readAllBytes(bundle.resolve("vertical.png"));
        request.putObject("source").put("imageSha256", CalibrationAdmission.hash(bytes))
            .put("bundleManifestSha256", CalibrationAdmission.hash(manifestBytes))
            .put("referenceSha256", CalibrationAdmission.hash(Files.readAllBytes(bundle.resolve("vertical-reference.json"))));
        request.putObject("sample").put("id", id + "-vertical").put("language", "ja").put("mime", "image/png")
            .put("sha256", CalibrationAdmission.hash(bytes)).put("bytes", bytes.length).put("width", 1200).put("height", 1200);
        return request;
    }
}
