package com.toonlira.translationgateway.application;

import static com.toonlira.translationgateway.domain.OcrLimits.MAX_REGIONS;
import static com.toonlira.translationgateway.domain.OcrLimits.MAX_TEXT_PER_REGION;
import static com.toonlira.translationgateway.domain.OcrLimits.MAX_TEXT_TOTAL;
import static com.toonlira.translationgateway.domain.OcrLimits.MAX_MANIFEST_BYTES;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;
import java.io.IOException;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.OcrGeometry;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class OcrManifestService {
    private final ObjectMapper mapper;

    public OcrManifestService(ObjectMapper mapper) { this.mapper = mapper; }

    public Encoded encode(OcrManifest manifest) {
        validate(manifest);
        try {
            var bytes = mapper.writeValueAsBytes(manifest);
            if (bytes.length > MAX_MANIFEST_BYTES) invalid();
            var hash = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
            return new Encoded(bytes, hash);
        } catch (JacksonException | NoSuchAlgorithmException error) {
            throw new GatewayException(GatewayErrorCode.OCR_INVALID_RESPONSE, 422, false);
        }
    }

    public OcrManifest decode(byte[] bytes) {
        if (bytes == null || bytes.length > MAX_MANIFEST_BYTES) invalid();
        try {
            var manifest = mapper.readValue(bytes, OcrManifest.class);
            validate(manifest);
            return manifest;
        } catch (JacksonException error) {
            throw new GatewayException(GatewayErrorCode.OCR_INVALID_RESPONSE, 422, false);
        }
    }

    private void validate(OcrManifest manifest) {
        if (manifest == null || !"1.0".equals(manifest.version()) || manifest.jobRef() == null
            || manifest.sourceLanguage() == null || manifest.widthPx() <= 0 || manifest.heightPx() <= 0
            || manifest.regions() == null || manifest.regions().size() > MAX_REGIONS) invalid();
        var ids = new HashSet<UUID>();
        int total = 0;
        for (int order = 0; order < manifest.regions().size(); order++) {
            var region = manifest.regions().get(order);
            if (region == null || region.id() == null || !ids.add(region.id()) || region.readingOrder() != order
                || region.sourceText() == null || region.sourceText().isBlank()
                || region.sourceText().length() > MAX_TEXT_PER_REGION
                || region.polygon() == null || region.polygon().size() != 4) invalid();
            total += region.sourceText().length();
            if (total > MAX_TEXT_TOTAL) invalid();
            if (!OcrGeometry.valid(region.polygon())) invalid();
        }
    }

    private void invalid() { throw new GatewayException(GatewayErrorCode.OCR_INVALID_RESPONSE, 422, false); }

    public record Encoded(byte[] bytes, String sha256) { }
}
