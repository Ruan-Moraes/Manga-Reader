package com.toonlira.translationgateway.infrastructure.translation;

/** One structured-output call to a language model: a system instruction and one JSON user turn, JSON back. */
interface GeminiClient {
    String generate(String systemInstruction, String userContent);
}
