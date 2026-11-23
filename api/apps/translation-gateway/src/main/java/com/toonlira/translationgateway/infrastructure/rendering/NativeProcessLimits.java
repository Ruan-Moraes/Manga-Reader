package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;

/** Experimental process ceilings, not a resident-memory or whole-worker admission. */
public record NativeProcessLimits(long addressSpaceBytes, long cpuSeconds, long fileBytes, long openFiles) {
    private static final long MIB = 1024L * 1024;
    private static final long GIB = 1024 * MIB;

    public NativeProcessLimits {
        if (addressSpaceBytes < 64 * MIB || addressSpaceBytes > 4 * GIB || cpuSeconds < 1 || cpuSeconds > 120
            || fileBytes < 1024 || fileBytes > 64 * MIB || openFiles < 32 || openFiles > 128)
            throw new RenderFileException(CONFIGURATION);
    }

    public static NativeProcessLimits initial() { return new NativeProcessLimits(3 * GIB, 120, 64 * MIB, 128); }

    @Override public String toString() { return "NativeProcessLimits[bounded]"; }
}
