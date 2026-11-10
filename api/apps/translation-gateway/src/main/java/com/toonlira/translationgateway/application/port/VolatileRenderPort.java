package com.toonlira.translationgateway.application.port;

import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import java.util.Arrays;

/** Caller transfers no file, object key or URL. Output ownership ends after response delivery. */
public interface VolatileRenderPort {
    default void requireAvailable() { }
    Output render(byte[] original, RenderRequest request);

    record Output(byte[] image, RenderManifest manifest) implements AutoCloseable {
        public Output {
            if (image == null || manifest == null || image.length != manifest.image().byteSize())
                throw new IllegalArgumentException("Invalid volatile output");
        }
        @Override public void close() { Arrays.fill(image, (byte) 0); }
        @Override public String toString() { return "VolatileRenderPort.Output[redacted]"; }
    }
}
