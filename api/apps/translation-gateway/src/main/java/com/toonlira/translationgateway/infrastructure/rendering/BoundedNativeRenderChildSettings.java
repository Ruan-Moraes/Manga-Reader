package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;

import java.time.Duration;

/** Explicit guarded variant; legacy CLI/TRN2 probes retain their separate historical semantics. */
public record BoundedNativeRenderChildSettings(NativeRenderChildSettings codec, NativeProcessLimits limits)
    implements RenderProcessSettings {
    public BoundedNativeRenderChildSettings {
        if (codec == null || limits == null) throw new RenderFileException(CONFIGURATION);
    }
    @Override public Duration nativeTimeout() { return codec.nativeTimeout(); }
    @Override public String toString() { return "BoundedNativeRenderChildSettings[redacted]"; }
}
