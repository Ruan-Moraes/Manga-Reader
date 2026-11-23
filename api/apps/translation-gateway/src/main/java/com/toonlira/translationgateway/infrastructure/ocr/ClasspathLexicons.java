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
        if (sourceLanguage == null || !com.toonlira.translationgateway.domain.SupportedLanguages.contains(sourceLanguage)) return Lexicon.NONE;
        return cache.computeIfAbsent(sourceLanguage, language -> {
            // Word list where there is one; named lists (sounds, particles...) for any language that has them.
            var words = FILES.containsKey(language) ? load(FILES.get(language)) : java.util.Set.<String>of();
            var lists = new java.util.HashMap<String, java.util.Set<String>>();
            for (var name : Lexicon.LISTS) {
                var list = load("lexicon/" + language + "-" + name + ".txt");
                if (!list.isEmpty()) lists.put(name, list);
            }
            return words.isEmpty() && lists.isEmpty() ? Lexicon.NONE : new Lexicon(words, lists);
        });
    }

    /** Lines of a bundled list as word cores ({@code #} comments skipped); empty when the file is missing. */
    private static java.util.Set<String> load(String file) {
        var stream = ClasspathLexicons.class.getClassLoader().getResourceAsStream(file);
        if (stream == null) return java.util.Set.of();
        var words = new HashSet<String>(65_536);
        try (var reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            for (String line; (line = reader.readLine()) != null; ) {
                if (line.startsWith("#")) continue;
                var core = Lexicon.core(line);
                if (!core.isEmpty()) words.add(core);
            }
        } catch (IOException unreadable) { return java.util.Set.of(); }
        return words;
    }
}
