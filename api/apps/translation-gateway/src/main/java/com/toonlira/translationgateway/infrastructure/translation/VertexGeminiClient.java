package com.toonlira.translationgateway.infrastructure.translation;

import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.HttpOptions;
import com.google.genai.types.HttpRetryOptions;
import com.google.genai.types.Part;
import com.google.genai.types.Schema;
import com.google.genai.types.ThinkingConfig;
import com.google.genai.types.Type;
import java.time.Duration;
import java.util.Map;

/** Gemini on Vertex AI under the worker's own identity (ADC); one attempt, bounded by the configured timeout. */
final class VertexGeminiClient implements GeminiClient, AutoCloseable {
    /** {regions:[{id, source|null, translation}]}, the only shape the refiner parses. */
    static final Schema RESPONSE_SCHEMA = Schema.builder().type(Type.Known.OBJECT)
        .properties(Map.of("regions", Schema.builder().type(Type.Known.ARRAY).items(Schema.builder().type(Type.Known.OBJECT)
            .properties(Map.of(
                "id", Schema.builder().type(Type.Known.STRING).build(),
                "source", Schema.builder().type(Type.Known.STRING).nullable(true).build(),
                "translation", Schema.builder().type(Type.Known.STRING).build()))
            .propertyOrdering("id", "source", "translation")
            .required("id", "translation").build()).build()))
        .required("regions").build();
    static final int MAX_OUTPUT_TOKENS = 16_384;

    private final Client client;
    private final String model;

    VertexGeminiClient(String projectId, String location, String model, Duration timeout) {
        this(Client.builder().vertexAI(true).project(projectId).location(location)
            .httpOptions(HttpOptions.builder().timeout(Math.toIntExact(timeout.toMillis()))
                .retryOptions(HttpRetryOptions.builder().attempts(1).build()).build())
            .build(), model);
    }

    VertexGeminiClient(Client client, String model) {
        this.client = client;
        this.model = model;
    }

    @Override
    public String generate(String systemInstruction, String userContent) {
        var request = GenerateContentConfig.builder()
            .systemInstruction(Content.fromParts(Part.fromText(systemInstruction)))
            .responseMimeType("application/json").responseSchema(RESPONSE_SCHEMA)
            // A review, not creative writing; thinking off keeps latency and cost bounded on flash models.
            .temperature(0.2f).maxOutputTokens(MAX_OUTPUT_TOKENS)
            .thinkingConfig(ThinkingConfig.builder().thinkingBudget(0).build())
            .build();
        var response = client.models.generateContent(model, Content.fromParts(Part.fromText(userContent)), request);
        return response == null ? null : response.text();
    }

    @Override
    public void close() { client.close(); }
}
