package com.toonlira.translationgateway.infrastructure.translation;

import com.google.cloud.translate.v3.TranslateTextResponse;
import com.toonlira.translationgateway.application.OcrManifestService;
import com.toonlira.translationgateway.application.TranslationManifestService;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationValidator;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.Map;
import java.util.Set;

/** Offline replay of an already captured real response; the only RPC is a credential-free loopback. */
public final class CapturedTranslationReplay {
    private CapturedTranslationReplay() { }

    public static void main(String[] arguments) throws Exception {
        if (arguments.length != 2 || !arguments[1].matches("[1-9][0-9]{0,19}")) throw new IllegalArgumentException();
        var root = Path.of(arguments[0]);
        if (!root.isAbsolute() || !root.equals(root.toRealPath())) throw new IllegalArgumentException();
        var input = root.resolve("provider-output");
        var mapper = GatewayJsonMapper.create();
        var receipt = mapper.readTree(read(input.resolve("result.json"), 65536));
        if (!"real".equals(receipt.path("providerMode").textValue())
            || receipt.path("cleanupPending").asBoolean(true)
            || receipt.path("ocrCallsStarted").intValue() != 1
            || receipt.path("translationCallsStarted").intValue() != 1) throw new IllegalStateException();
        var ocrBytes = read(input.resolve("ocr-manifest.json"), 1024 * 1024);
        var responseBytes = read(input.resolve("translation-response.pb"), 4 * 1024 * 1024);
        var source = read(input.resolve("source.png"), 65536);
        requireHash(source, receipt.path("sourceSha256").textValue());
        requireHash(ocrBytes, receipt.path("ocrManifestSha256").textValue());
        requireHash(responseBytes, receipt.path("translationCapture").path("sha256").textValue());
        requireHash(read(input.resolve("vision-response.pb"), 4 * 1024 * 1024),
            receipt.path("visionCapture").path("sha256").textValue());
        var ocr = new OcrManifestService(mapper).decode(ocrBytes);
        var request = new TranslationRequest(ocr.jobRef(), new LanguagePair("en", "pt-BR"), ocr.regions().stream()
            .map(region -> new TranslationRequest.Region(region.id(), region.readingOrder(), region.sourceText())).toList());
        var response = TranslateTextResponse.parseFrom(responseBytes);
        try (var server = new FakeTranslationServer()) {
            server.handler = (ignored, observer) -> { observer.onNext(response); observer.onCompleted(); };
            try (var adapter = new CloudTranslationAdapter(server.client(Duration.ofSeconds(5)), arguments[1])) {
                var translated = adapter.translate(request);
                var result = new TranslationValidator(Set.of(request.pair())).validateResponse(request, translated);
                var manifests = new TranslationManifestService(mapper);
                var encoded = manifests.encode(result, hash(ocrBytes));
                manifests.decode(encoded.bytes(), encoded.sha256(), request, hash(ocrBytes));
                if (server.calls.get() != 1) throw new IllegalStateException();
                var output = Files.createDirectory(root.resolve("offline-replay"),
                    PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rwx------")));
                write(output.resolve("translation-manifest.json"), encoded.bytes());
                write(output.resolve("receipt.json"), mapper.writeValueAsBytes(Map.of(
                    "outcome", "captured-real-response-validated", "newPaidCalls", 0,
                    "sourceSha256", hash(source), "ocrManifestSha256", hash(ocrBytes),
                    "capturedTranslationSha256", hash(responseBytes), "translationManifestSha256", encoded.sha256(),
                    "regions", result.regions().size(), "model", "general/translation-llm")));
                System.out.println("Captured response validated offline; no paid calls");
            }
        }
    }

    private static byte[] read(Path path, int limit) throws Exception {
        if (!Files.isRegularFile(path) || Files.isSymbolicLink(path) || Files.size(path) > limit) throw new IllegalArgumentException();
        try (var stream = Files.newInputStream(path)) {
            byte[] bytes = stream.readNBytes(limit + 1);
            if (bytes.length > limit) throw new IllegalArgumentException();
            return bytes;
        }
    }

    private static String hash(byte[] bytes) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }

    private static void requireHash(byte[] bytes, String expected) throws Exception {
        if (!hash(bytes).equals(expected)) throw new IllegalArgumentException();
    }

    private static void write(Path path, byte[] bytes) throws Exception {
        Files.createFile(path, PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")));
        Files.write(path, bytes);
    }
}
