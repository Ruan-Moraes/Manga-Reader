package com.toonlira.translationgateway.application.port;

import static com.toonlira.translationgateway.domain.rendering.RenderValidationException.Failure.INVALID_OUTPUT;

import com.toonlira.translationgateway.domain.rendering.RenderManifest;
import com.toonlira.translationgateway.domain.rendering.RenderRequest;
import com.toonlira.translationgateway.domain.rendering.RenderValidationException;
import java.nio.file.Path;

/** Local copy and output ownership belongs to the caller; no object keys or URLs cross this port. */
public interface RenderPort {
    Output render(Path original, RenderRequest request);

    record Output(Path path, RenderManifest manifest) {
        public Output {
            if (path == null || manifest == null) throw new RenderValidationException(INVALID_OUTPUT);
        }

        @Override public String toString() { return "RenderPort.Output[redacted]"; }
    }
}
