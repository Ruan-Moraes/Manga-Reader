package com.toonlira.translationgateway.evaluation;

import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.Instant;
import java.util.Map;

/** Explicit operator-only pilot. Validation performs no external action or credential discovery. */
final class RealPagePilotAdmission {
    private static final int MAX_SOURCE_BYTES = 64 * 1024;
    private RealPagePilotAdmission() { }

    static Input admit(Path root, boolean explicitlyApproved) {
        try {
            if (!explicitlyApproved || root == null || !root.isAbsolute() || Files.isSymbolicLink(root)
                || !root.toRealPath().equals(root)
                || !Files.getPosixFilePermissions(root).equals(PosixFilePermissions.fromString("rwx------"))) invalid();
            var requestPath = root.resolve("approved-request.json");
            if (Files.isSymbolicLink(requestPath) || Files.size(requestPath) > 65536) invalid();
            var request = GatewayJsonMapper.create().readTree(Files.readAllBytes(requestPath));
            if (!request.path("paidCallsApproved").isBoolean() || !request.path("paidCallsApproved").booleanValue()
                || !request.path("maxCostCents").isIntegralNumber() || request.path("maxCostCents").intValue() != 100
                || !"self-generated-synthetic-dialogue".equals(request.path("fixture").asText())
                || !"toonlira-rm".equals(request.path("project").asText())
                || !"toonlira-rm-ocr-eval".equals(request.path("bucket").asText())
                || !"en".equals(request.path("sourceLanguage").asText())
                || !"pt-BR".equals(request.path("targetLanguage").asText())
                || request.path("widthPx").asInt() != 900 || request.path("heightPx").asInt() != 600) invalid();
            var identityPath = root.resolve("project-identity.json");
            if (Files.isSymbolicLink(identityPath) || Files.size(identityPath) > 65536) invalid();
            var identity = GatewayJsonMapper.create().readTree(Files.readAllBytes(identityPath));
            var projectNumber = identity.path("projectNumber").textValue();
            if (!request.path("project").asText().equals(identity.path("projectId").textValue())
                || projectNumber == null || !projectNumber.matches("[1-9][0-9]{0,19}")) invalid();
            var source = root.resolve("source-en.png");
            if (Files.isSymbolicLink(source) || !Files.isRegularFile(source, LinkOption.NOFOLLOW_LINKS)) invalid();
            byte[] snapshot;
            try (var stream = Files.newInputStream(source, LinkOption.NOFOLLOW_LINKS)) {
                snapshot = stream.readNBytes(MAX_SOURCE_BYTES + 1);
            }
            if (snapshot.length == 0 || snapshot.length > MAX_SOURCE_BYTES) invalid();
            var inspector = new MediaInspectionService();
            var media = inspector.inspect(new ByteArrayInputStream(snapshot), MAX_SOURCE_BYTES);
            try {
                if (!"image/png".equals(media.mimeType()) || media.widthPx() != 900 || media.heightPx() != 600
                    || !media.sha256().equals(request.path("sourceSha256").asText())) invalid();
                return new Input(root, source, media.sha256(), snapshot, request.path("project").asText(), request.path("bucket").asText(), projectNumber);
            } finally { inspector.deleteQuietly(media.path()); }
        } catch (Exception ignored) { throw new IllegalArgumentException("real-page-pilot-not-admitted"); }
    }

    static void claim(Input input) {
        try {
            var marker = GatewayJsonMapper.create().writeValueAsBytes(Map.of(
                "state", "started-no-automatic-resume", "startedAt", Instant.now().toString(), "sourceSha256", input.sha256()));
            var path = input.root().resolve("provider-invocation.lock");
            Files.createFile(path, PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")));
            Files.write(path, marker, StandardOpenOption.WRITE);
        } catch (Exception ignored) { throw new IllegalStateException("real-page-pilot-already-started"); }
    }

    private static void invalid() { throw new IllegalArgumentException("real-page-pilot-not-admitted"); }

    record Input(Path root, Path source, String sha256, byte[] sourceBytes, String project, String bucket, String projectNumber) {
        Input { sourceBytes = sourceBytes.clone(); }
        @Override public byte[] sourceBytes() { return sourceBytes.clone(); }
        @Override public String toString() { return "RealPagePilotInput[redacted]"; }
    }
}
