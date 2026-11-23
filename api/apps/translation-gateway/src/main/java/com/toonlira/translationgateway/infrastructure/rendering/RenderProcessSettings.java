package com.toonlira.translationgateway.infrastructure.rendering;

import java.time.Duration;

/** Local process configuration, never supplied by a task or provider. */
public sealed interface RenderProcessSettings permits RenderChildSettings, NativeRenderChildSettings,
    BoundedNativeRenderChildSettings {
    Duration nativeTimeout();
}
