package com.toonlira.translationgateway.application;

import static com.toonlira.translationgateway.domain.GatewayErrorCode.INVALID_REQUEST;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.ChapterMemoryRepository;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.translation.ChapterTerm;
import com.toonlira.translationgateway.domain.translation.LanguagePair;
import java.time.Clock;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

/**
 * The chapter glossary a client keeps and sends back with a page: names this gateway decided for the chapter's earlier
 * pages and reported in their results. It refills the chapter memory where it expired (a pause past the result
 * retention), never overrides a term the memory still holds, and is data for translation, never instructions.
 */
@Service
public class SeedChapterGlossaryUseCase {
    private static final Logger LOG = LoggerFactory.getLogger(SeedChapterGlossaryUseCase.class);
    /** Most entries one page may send. */
    public static final int MAX_ENTRIES = 256;
    /** Longest glossary field, in characters. */
    public static final int MAX_CHARS = 32_768;

    private final ChapterMemoryRepository memory;
    private final GatewayProperties properties;
    private final Clock clock;
    private final ObjectMapper mapper = new ObjectMapper();

    public SeedChapterGlossaryUseCase(ChapterMemoryRepository memory, GatewayProperties properties, Clock clock) {
        this.memory = memory;
        this.properties = properties;
        this.clock = clock;
    }

    /** {@code [{"source":"…","target":"…"}]}, bounded; anything else is a malformed request (400). */
    public Map<String, String> parse(String glossary) {
        if (glossary == null || glossary.isBlank()) return Map.of();
        if (glossary.length() > MAX_CHARS) throw new GatewayException(INVALID_REQUEST, 400, false);
        try {
            var root = mapper.readTree(glossary);
            if (!root.isArray() || root.size() > MAX_ENTRIES) throw new GatewayException(INVALID_REQUEST, 400, false);
            var terms = new LinkedHashMap<String, String>();
            for (var entry : root) {
                if (!entry.isObject() || entry.size() != 2 || !entry.path("source").isString() || !entry.path("target").isString()) {
                    throw new GatewayException(INVALID_REQUEST, 400, false);
                }
                var term = new ChapterTerm(entry.path("source").asString(), entry.path("target").asString());
                if (terms.putIfAbsent(term.source(), term.target()) != null) throw new GatewayException(INVALID_REQUEST, 400, false);
            }
            return terms;
        } catch (GatewayException error) {
            throw error;
        } catch (RuntimeException malformed) {
            throw new GatewayException(INVALID_REQUEST, 400, false);
        }
    }

    /** Best effort: a glossary can make a page more consistent, never fail its submission. */
    public void seed(UUID installationId, UUID contextRef, String sourceLanguage, String targetLanguage, Map<String, String> terms) {
        if (installationId == null || contextRef == null || terms.isEmpty()) return;
        try {
            var now = clock.instant();
            var expires = now.plus(Duration.ofSeconds(properties.getDisclosure().getResultRetentionSeconds()));
            memory.remember(installationId, contextRef, new LanguagePair(sourceLanguage, targetLanguage), terms, terms.keySet(), now, expires);
        } catch (RuntimeException error) {
            LOG.warn("chapter glossary not seeded: {}", FailureDiagnostics.describe(error));
        }
    }
}
