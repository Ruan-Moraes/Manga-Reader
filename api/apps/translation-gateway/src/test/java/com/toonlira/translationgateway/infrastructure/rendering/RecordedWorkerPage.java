package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.application.OcrManifestService;
import com.toonlira.translationgateway.application.TranslationManifestService;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import com.toonlira.translationgateway.domain.translation.TranslationRequest;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;

/** Immutable, hash-bound replay input. Provenance is recorded separately; this never calls a provider. */
final class RecordedWorkerPage {
    private final OcrManifest ocr;
    private final TranslationRequest request;
    private final TranslationResponse response;
    private final String sourceSha256;

    private RecordedWorkerPage(OcrManifest ocr, TranslationRequest request, TranslationResponse response, String sourceSha256) {
        this.ocr = ocr; this.request = request; this.response = response; this.sourceSha256 = sourceSha256;
    }

    static RecordedWorkerPage load(Path root) throws Exception {
        var mapper = GatewayJsonMapper.create();
        var receipt = mapper.readTree(read(root.resolve("receipt.json"), 65536));
        var sourceHash = receipt.path("sourceSha256").textValue();
        if (!"captured-real-response-validated".equals(receipt.path("outcome").textValue())
            || !receipt.path("newPaidCalls").isInt() || receipt.path("newPaidCalls").intValue() != 0
            || sourceHash == null || !sourceHash.matches("[a-f0-9]{64}")) throw new IllegalArgumentException();
        byte[] ocrBytes = read(root.resolve("ocr-manifest.json"), 1024 * 1024);
        var ocrHash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(ocrBytes));
        if (!ocrHash.equals(receipt.path("ocrManifestSha256").textValue())) throw new IllegalArgumentException();
        var ocr = new OcrManifestService(mapper).decode(ocrBytes);
        if (!"en".equals(ocr.sourceLanguage()) || ocr.widthPx() != 900 || ocr.heightPx() != 600
            || ocr.regions().isEmpty() || ocr.regions().size() > 16) throw new IllegalArgumentException();
        var request = new TranslationRequest(ocr.jobRef(), new LanguagePair("en", "pt-BR"), ocr.regions().stream()
            .map(region -> new TranslationRequest.Region(region.id(), region.readingOrder(), region.sourceText())).toList());
        var translated = new TranslationManifestService(mapper).decode(read(root.resolve("translation-manifest.json"), 4 * 1024 * 1024),
            receipt.path("translationManifestSha256").textValue(), request, ocrHash);
        return new RecordedWorkerPage(ocr, request, new TranslationResponse(translated.regions().stream()
            .map(region -> new TranslationResponse.Region(region.id(), region.translatedText())).toList()), sourceHash);
    }

    UUID jobRef() { return ocr.jobRef(); }
    String sourceSha256() { return sourceSha256; }
    List<OcrManifest.Region> regions() { return ocr.regions(); }
    String translatedText(int index) { return response.regions().get(index).translatedText(); }

    List<OcrManifest.Region> recognize(OcrPort.Command command) {
        if (!ocr.jobRef().equals(command.jobRef()) || !ocr.sourceLanguage().equals(command.sourceLanguage())
            || ocr.widthPx() != command.widthPx() || ocr.heightPx() != command.heightPx()) throw new IllegalArgumentException();
        return ocr.regions();
    }

    TranslationResponse translate(TranslationRequest incoming) {
        if (!request.equals(incoming)) throw new IllegalArgumentException();
        return response;
    }

    private static byte[] read(Path path, int limit) throws Exception {
        if (!Files.isRegularFile(path) || Files.isSymbolicLink(path) || Files.size(path) > limit) throw new IllegalArgumentException();
        try (var stream = Files.newInputStream(path)) {
            var bytes = stream.readNBytes(limit + 1);
            if (bytes.length > limit) throw new IllegalArgumentException();
            return bytes;
        }
    }
}
