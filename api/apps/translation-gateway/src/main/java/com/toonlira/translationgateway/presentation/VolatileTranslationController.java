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
    private final ProcessVolatilePageUseCase processor;
    private final VolatileAttemptUseCase attempts;
    public VolatileTranslationController(ProcessVolatilePageUseCase processor, VolatileAttemptUseCase attempts) {
        this.processor = processor; this.attempts = attempts;
    }

    @PostMapping(consumes = {"image/jpeg", "image/png", "image/webp"}, produces = RESULT_CONTENT_TYPE)
    public void process(Authentication authentication, HttpServletRequest request, HttpServletResponse response,
                        @RequestHeader("Idempotency-Key") UUID key,
                        @RequestHeader("X-Image-Byte-Size") long size,
                        @RequestHeader("X-Image-Width") int width,
                        @RequestHeader("X-Image-Height") int height,
                        @RequestHeader("X-Source-Language") String source,
                        @RequestHeader("X-Target-Language") String target,
                        @RequestHeader("X-Disclosure-Version") String disclosure) throws IOException {
        if (request.getContentLengthLong() >= 0 && request.getContentLengthLong() != size)
            throw new GatewayException(GatewayErrorCode.INVALID_REQUEST, 400, false);
        var command = new ProcessVolatilePageUseCase.Command(request.getContentType(), size, width, height, source, target, disclosure);
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

    @GetMapping("/by-idempotency/{key}")
    public ResponseEntity<Receipt> receipt(Authentication authentication, @PathVariable UUID key) {
        processor.requireEnabled();
        var value = attempts.find((UUID) authentication.getPrincipal(), key)
            .orElseThrow(() -> new GatewayException(GatewayErrorCode.JOB_NOT_FOUND, 404, false));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(new Receipt("2.0", value, false));
    }
    public record Receipt(String contractVersion, VolatileAttemptRepository.Receipt receipt, boolean contentRecoverable) { }
}
