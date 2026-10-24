package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;

import java.nio.file.Path;
import java.time.Duration;

/** Explicit pinned FFM libraries. Construction neither loads native code nor downloads it. */
public record NativeRenderChildSettings(Path library, String librarySha256, Path sharpLibrary, String sharpSha256,
                                       Duration nativeTimeout) implements RenderProcessSettings {
    public NativeRenderChildSettings {
        if (library == null || !library.isAbsolute() || sharpLibrary == null || !sharpLibrary.isAbsolute()
            || librarySha256 == null || !librarySha256.matches("[0-9a-f]{64}")
            || sharpSha256 == null || !sharpSha256.matches("[0-9a-f]{64}")
            || nativeTimeout == null || nativeTimeout.isZero() || nativeTimeout.isNegative()
            || nativeTimeout.compareTo(Duration.ofSeconds(60)) > 0) throw new RenderFileException(CONFIGURATION);
    }

    @Override public String toString() { return "NativeRenderChildSettings[redacted]"; }
}
