package com.toonlira.translationgateway.evaluation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.awt.image.BufferedImage;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class RealPagePilotAdmissionTest {
    @TempDir Path root;
    private Map<String, Object> request;

    @BeforeEach void preparePrivateSyntheticImage() throws Exception {
        root = root.toRealPath();
        Files.setPosixFilePermissions(root, PosixFilePermissions.fromString("rwx------"));
        var image = new BufferedImage(900, 600, BufferedImage.TYPE_INT_RGB);
        try { ImageIO.write(image, "png", root.resolve("source-en.png").toFile()); }
        finally { image.flush(); }
        request = new LinkedHashMap<>(Map.of("fixture", "self-generated-synthetic-dialogue", "sourceLanguage", "en",
            "targetLanguage", "pt-BR", "sourceSha256", hash(Files.readAllBytes(root.resolve("source-en.png"))),
            "widthPx", 900, "heightPx", 600, "paidCallsApproved", true, "maxCostCents", 100,
            "project", "toonlira-rm", "bucket", "toonlira-rm-ocr-eval"));
        writeRequest();
        writeIdentity("toonlira-rm", "123456789012");
    }

    @Test void validatesApprovalAndExactImageBeforeAnyExternalAction() throws Exception {
        var input = RealPagePilotAdmission.admit(root, true);
        assertThat(input.source()).isEqualTo(root.resolve("source-en.png"));
        assertThat(input.project()).isEqualTo("toonlira-rm");
        assertThat(input.bucket()).isEqualTo("toonlira-rm-ocr-eval");
        assertThat(root.resolve("provider-invocation.lock")).doesNotExist();
        assertThat(input.toString()).doesNotContain(root.toString(), "toonlira-rm-ocr-eval");
    }

    @Test void refusesMissingApprovalChangedPairAndLargerBudget() throws Exception {
        assertThatThrownBy(() -> RealPagePilotAdmission.admit(root, false)).hasMessage("real-page-pilot-not-admitted");
        for (var entry : Map.<String, Object>of("paidCallsApproved", false, "targetLanguage", "es", "maxCostCents", 101).entrySet()) {
            var before = request.put(entry.getKey(), entry.getValue()); writeRequest();
            assertThatThrownBy(() -> RealPagePilotAdmission.admit(root, true)).hasMessage("real-page-pilot-not-admitted");
            request.put(entry.getKey(), before);
        }
        assertThat(root.resolve("provider-invocation.lock")).doesNotExist();
    }

    @Test void rejectsChangedBytesAndSymlinkWithoutFollowingThem() throws Exception {
        request.put("sourceSha256", "0".repeat(64)); writeRequest();
        assertThatThrownBy(() -> RealPagePilotAdmission.admit(root, true)).hasMessage("real-page-pilot-not-admitted");
        var alias = root.resolve("alias"); Files.createSymbolicLink(alias, root);
        assertThatThrownBy(() -> RealPagePilotAdmission.admit(alias, true)).hasMessage("real-page-pilot-not-admitted");
    }

    @Test void refusesMissingMismatchedOrInvalidCanonicalProjectIdentity() throws Exception {
        Files.delete(root.resolve("project-identity.json"));
        assertThatThrownBy(() -> RealPagePilotAdmission.admit(root, true)).hasMessage("real-page-pilot-not-admitted");
        writeIdentity("other-project", "123456789012");
        assertThatThrownBy(() -> RealPagePilotAdmission.admit(root, true)).hasMessage("real-page-pilot-not-admitted");
        writeIdentity("toonlira-rm", "not-numeric");
        assertThatThrownBy(() -> RealPagePilotAdmission.admit(root, true)).hasMessage("real-page-pilot-not-admitted");
    }

    private void writeIdentity(String projectId, String number) throws Exception {
        Files.write(root.resolve("project-identity.json"), GatewayJsonMapper.create().writeValueAsBytes(
            Map.of("projectId", projectId, "projectNumber", number)));
    }

    @Test void oneClaimPreventsAccidentalReplayAndPreservesFirstMarker() throws Exception {
        RealPagePilotAdmission.claim(RealPagePilotAdmission.admit(root, true));
        var marker = Files.readAllBytes(root.resolve("provider-invocation.lock"));
        assertThatThrownBy(() -> RealPagePilotAdmission.claim(RealPagePilotAdmission.admit(root, true)))
            .hasMessage("real-page-pilot-already-started");
        assertThat(Files.readAllBytes(root.resolve("provider-invocation.lock"))).isEqualTo(marker);
        assertThat(Files.getPosixFilePermissions(root.resolve("provider-invocation.lock")))
            .isEqualTo(PosixFilePermissions.fromString("rw-------"));
    }

    private void writeRequest() throws Exception {
        Files.write(root.resolve("approved-request.json"), GatewayJsonMapper.create().writeValueAsBytes(request));
    }

    private static String hash(byte[] bytes) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }
}
