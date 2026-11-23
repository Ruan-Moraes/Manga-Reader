package com.toonlira.translationgateway.presentation;

import com.toonlira.translationgateway.application.ProcessVolatilePageUseCase;
import com.toonlira.translationgateway.application.VolatileAttemptUseCase;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.VolatileAttemptRepository;
import com.toonlira.translationgateway.application.port.VolatileSessionPort;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.GatewayException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.DataOutputStream;
import java.io.IOException;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@Profile("!worker")
@RequestMapping("/v2/page-translations")
public class VolatileTranslationController {
    private static final int RESPONSE_MAGIC = 0x54565231;
    public static final String RESULT_CONTENT_TYPE = "application/vnd.toonlira.translation+binary";
    /** Largest glossary body read, in bytes (the parser then caps it at 32768 characters). */
    static final int MAX_GLOSSARY_BYTES = 4 * com.toonlira.translationgateway.application.SeedChapterGlossaryUseCase.MAX_CHARS;
    private final ProcessVolatilePageUseCase processor;
    private final VolatileAttemptUseCase attempts;
    private final com.toonlira.translationgateway.application.SeedChapterGlossaryUseCase glossaries;
    private final GatewayProperties properties;
    public VolatileTranslationController(ProcessVolatilePageUseCase processor, VolatileAttemptUseCase attempts,
                                         com.toonlira.translationgateway.application.SeedChapterGlossaryUseCase glossaries,
                                         GatewayProperties properties) {
        this.processor = processor; this.attempts = attempts; this.glossaries = glossaries; this.properties = properties;
    }

    @PostMapping(consumes = {"image/jpeg", "image/png", "image/webp"}, produces = RESULT_CONTENT_TYPE)
    public void process(Authentication authentication, HttpServletRequest request, HttpServletResponse response,
                        @RequestHeader("Idempotency-Key") UUID key,
                        @RequestHeader("X-Image-Byte-Size") long size,
                        @RequestHeader("X-Image-Width") int width,
                        @RequestHeader("X-Image-Height") int height,
                        @RequestHeader("X-Source-Language") String source,
                        @RequestHeader("X-Target-Language") String target,
                        @RequestHeader("X-Disclosure-Version") String disclosure,
                        @RequestHeader(value = "X-Context-Ref", required = false) UUID contextRef) throws IOException {
        if (request.getContentLengthLong() >= 0 && request.getContentLengthLong() != size)
            throw new GatewayException(GatewayErrorCode.INVALID_REQUEST, 400, false);
        var command = new ProcessVolatilePageUseCase.Command(request.getContentType(), size, width, height, source, target, disclosure, contextRef);
        try (var input = request.getInputStream()) {
            processor.execute((UUID) authentication.getPrincipal(), key, command, input, new ProcessVolatilePageUseCase.Sink() {
                @Override public void deliver(byte[] manifest, byte[] image, VolatileSessionPort.Fence fence) throws IOException {
                fence.checkActive();
                response.setHeader("Cache-Control", "no-store");
                response.setHeader("X-Content-Type-Options", "nosniff");
                response.setContentType(RESULT_CONTENT_TYPE);
                response.setContentLengthLong(12L + manifest.length + image.length);
                var output = new DataOutputStream(response.getOutputStream());
                output.writeInt(RESPONSE_MAGIC);
                output.writeInt(manifest.length); writeActive(output, manifest, fence);
                output.writeInt(image.length); writeActive(output, image, fence);
                output.flush();
                }
                @Override public void cancel() throws IOException { response.getOutputStream().close(); }
            });
        }
    }

    private static void writeActive(DataOutputStream output, byte[] bytes, VolatileSessionPort.Fence fence) throws IOException {
        final int chunkBytes = 16_384;
        for (int offset = 0; offset < bytes.length; offset += chunkBytes) {
            fence.checkActive();
            output.write(bytes, offset, Math.min(chunkBytes, bytes.length - offset));
        }
    }

    /**
     * The chapter glossary a client keeps (names the gateway decided for this chapter's earlier pages, from their
     * results) refills the chapter memory before the next page, e.g. after a pause past its retention. Never overrides
     * a term the memory still holds; data for translation, never instructions. Requires the current disclosure, which
     * names this storage.
     */
    @PutMapping(path = "/chapter-contexts/{contextRef}/glossary", consumes = "application/json")
    public ResponseEntity<Void> glossary(Authentication authentication, HttpServletRequest request, @PathVariable UUID contextRef,
                                         @RequestParam String sourceLanguage, @RequestParam String targetLanguage,
                                         @RequestHeader("X-Disclosure-Version") String disclosure) throws IOException {
        processor.requireEnabled();
        if (properties.getDisclosure().getVersion().isBlank() || !properties.getDisclosure().getVersion().equals(disclosure))
            throw new GatewayException(GatewayErrorCode.CONSENT_REQUIRED, 409, false);
        if (request.getContentLengthLong() > MAX_GLOSSARY_BYTES) throw new GatewayException(GatewayErrorCode.PAYLOAD_TOO_LARGE, 413, false);
        byte[] body;
        try (var input = request.getInputStream()) { body = input.readNBytes(MAX_GLOSSARY_BYTES + 1); }
        if (body.length > MAX_GLOSSARY_BYTES) throw new GatewayException(GatewayErrorCode.PAYLOAD_TOO_LARGE, 413, false);
        var terms = glossaries.parse(new String(body, java.nio.charset.StandardCharsets.UTF_8));
        processor.requirePair(sourceLanguage, targetLanguage);
        glossaries.seed((UUID) authentication.getPrincipal(), contextRef, sourceLanguage, targetLanguage, terms);
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }

    @GetMapping("/by-idempotency/{key}")
    public ResponseEntity<Receipt> receipt(Authentication authentication, @PathVariable UUID key) {
        processor.requireEnabled();
        var value = attempts.find((UUID) authentication.getPrincipal(), key)
            .orElseThrow(() -> new GatewayException(GatewayErrorCode.JOB_NOT_FOUND, 404, false));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(new Receipt("2.0", value, false));
    }
    public record Receipt(String contractVersion, VolatileAttemptRepository.Receipt receipt, boolean contentRecoverable) { }
}
