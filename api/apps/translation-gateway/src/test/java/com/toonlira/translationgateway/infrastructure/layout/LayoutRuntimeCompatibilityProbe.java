package com.toonlira.translationgateway.infrastructure.layout;

import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtLoggingLevel;
import java.nio.file.Path;
import java.util.Locale;
import java.util.logging.LogManager;

/** Test-only offline bootstrap probe: no images, ADC, SDK provider, network or raw throwable output. */
public final class LayoutRuntimeCompatibilityProbe {
    private LayoutRuntimeCompatibilityProbe() { }
    public static void main(String[] arguments) {
        LogManager.getLogManager().reset();
        long started = System.nanoTime();
        String phase = "model-verification", outcome = "failed", failure = "none";
        try {
            if (arguments.length != 1) throw new IllegalArgumentException("Invalid probe input");
            var model = Path.of(arguments[0]);
            ComicDetectorModel.verify(model);
            phase = "runtime-load";
            OrtEnvironment.getEnvironment(OrtLoggingLevel.ORT_LOGGING_LEVEL_FATAL);
            phase = "session-create";
            try (var detector = new OnnxBubbleDetector(model)) {
                phase = "session-ready";
                outcome = "succeeded";
            }
        } catch (Throwable error) {
            failure = classify(error);
        }
        System.out.printf(Locale.ROOT,
            "{\"probeVersion\":\"1.0\",\"outcome\":\"%s\",\"phase\":\"%s\",\"failure\":\"%s\",\"elapsedNanos\":%d,\"providerMode\":\"none\",\"imageCount\":0}%n",
            outcome, phase, failure, System.nanoTime() - started);
    }
    static String classify(Throwable error) {
        boolean linkage = false;
        for (int depth = 0; error != null && depth < 8; depth++, error = error.getCause()) {
            String message = error.getMessage() == null ? "" : error.getMessage();
            // Allowlisted linker categories only. Never print a path, message or throwable.
            if (message.contains("libc.so.6")) return "missing-glibc";
            if (message.contains("libstdc++.so.6")) return "missing-libstdcxx";
            if (message.contains("GLIBC_")) return "glibc-version-mismatch";
            linkage |= error instanceof LinkageError;
        }
        return linkage ? "native-linkage-unavailable" : "bootstrap-unavailable";
    }
}
