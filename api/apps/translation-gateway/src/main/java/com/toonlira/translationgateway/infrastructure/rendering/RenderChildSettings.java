package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;

import java.nio.file.Path;
import java.time.Duration;

/** Explicit prepared tools, not paths inferred from an image/task or environment. */
public record RenderChildSettings(Path encoder, String encoderSha256, Path decoder, String decoderSha256,
                                  Duration nativeTimeout) implements RenderProcessSettings {
    public RenderChildSettings {
        if (encoder == null || !encoder.isAbsolute() || decoder == null || !decoder.isAbsolute()
            || encoderSha256 == null || !encoderSha256.matches("[0-9a-f]{64}")
            || decoderSha256 == null || !decoderSha256.matches("[0-9a-f]{64}")
            || nativeTimeout == null || nativeTimeout.isZero() || nativeTimeout.isNegative()
            || nativeTimeout.compareTo(Duration.ofSeconds(60)) > 0) throw new RenderFileException(CONFIGURATION);
    }

    @Override public String toString() { return "RenderChildSettings[redacted]"; }
}
