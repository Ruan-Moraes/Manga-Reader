package com.toonlira.translationgateway.infrastructure.ocr;

import com.toonlira.translationgateway.application.port.LexiconPort;
import com.toonlira.translationgateway.domain.ocr.Lexicon;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/** Bundled word lists ({@code lexicon/<language>.txt}, see lexicon/NOTICE.md), loaded once per language. */
@Component
public class ClasspathLexicons implements LexiconPort {
    private static final Map<String, String> FILES = Map.of("en", "lexicon/en.txt", "es", "lexicon/es.txt", "pt-BR", "lexicon/pt-BR.txt");
    private final Map<String, Lexicon> cache = new ConcurrentHashMap<>();

    @Override
    public Lexicon forLanguage(String sourceLanguage) {
        var file = sourceLanguage == null ? null : FILES.get(sourceLanguage);
        if (file == null) return Lexicon.NONE;
        return cache.computeIfAbsent(sourceLanguage, ignored -> load(file));
    }

    private static Lexicon load(String file) {
        var stream = ClasspathLexicons.class.getClassLoader().getResourceAsStream(file);
        if (stream == null) return Lexicon.NONE;
        var words = new HashSet<String>(65_536);
        try (var reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            for (String line; (line = reader.readLine()) != null; ) {
                var core = Lexicon.core(line);
                if (!core.isEmpty()) words.add(core);
            }
        } catch (IOException unreadable) { return Lexicon.NONE; }
        return new Lexicon(words);
    }
}
