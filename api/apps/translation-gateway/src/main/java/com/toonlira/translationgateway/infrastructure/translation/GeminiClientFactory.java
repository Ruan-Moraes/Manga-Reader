package com.toonlira.translationgateway.infrastructure.translation;

import java.time.Duration;

/** Seam for tests: the real factory builds a Vertex AI client under the worker's Application Default Credentials. */
public class GeminiClientFactory {
    GeminiClient create(String projectId, String location, String model, Duration timeout) {
        return new VertexGeminiClient(projectId, location, model, timeout);
    }
}
