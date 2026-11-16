package com.toonlira.translationgateway.infrastructure.translation;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/** Literals (product names, URLs, shell variables) that must reach the page exactly as written in the source. */
final class ProtectedTerms {
    static final String OPEN = "<span translate=\"no\">";
    static final String CLOSE = "</span>";
    private static final String RESOURCE = "/glossary/protected-terms.txt";
    // URLs, $variables, file names ("Skegness.pdf": lower-case extension right after the dot) and snake_case
    // identifiers ("case_ubuntu_v2"): names a translator would mangle ("caso_Wellcome.pdf").
    private static final String PATTERNS = "https?://[^\\s<>\"]+|\\$[A-Za-z_][A-Za-z0-9_]*"
        + "|[\\p{L}\\p{N}_-]+\\.[a-z][a-z0-9]{1,3}(?![\\p{L}\\p{N}.])"
        + "|[\\p{L}\\p{N}]+(?:_[\\p{L}\\p{N}]*)+";
    private final Pattern pattern;

    ProtectedTerms() { this(load()); }

    ProtectedTerms(List<String> terms) {
        var alternatives = new ArrayList<String>();
        for (var term : terms) alternatives.add("(?<![\\p{L}\\p{N}])" + Pattern.quote(term) + "(?![\\p{L}\\p{N}])");
        alternatives.add(PATTERNS);
        pattern = Pattern.compile(String.join("|", alternatives));
    }

    /** Literal tokens found in the source text, in order. */
    List<String> find(String text) {
        var found = new ArrayList<String>();
        var matcher = pattern.matcher(text);
        while (matcher.find()) found.add(matcher.group());
        return found;
    }

    /** True when the text is only protected literals, digits and punctuation: nothing a translator should touch. */
    boolean isLiteralOnly(String text) {
        return pattern.matcher(text).replaceAll("").codePoints().noneMatch(Character::isLetter);
    }

    /** Escapes plain text and wraps every protected literal in a translate="no" span. */
    String wrap(String text, java.util.function.UnaryOperator<String> escape) {
        var out = new StringBuilder();
        var matcher = pattern.matcher(text);
        int offset = 0;
        while (matcher.find()) {
            out.append(escape.apply(text.substring(offset, matcher.start())))
                .append(OPEN).append(escape.apply(matcher.group())).append(CLOSE);
            offset = matcher.end();
        }
        return out.append(escape.apply(text.substring(offset))).toString();
    }

    private static List<String> load() {
        try (var in = ProtectedTerms.class.getResourceAsStream(RESOURCE)) {
            if (in == null) throw new IllegalStateException("missing glossary");
            return new String(in.readAllBytes(), StandardCharsets.UTF_8).lines()
                .map(String::strip).filter(line -> !line.isEmpty() && !line.startsWith("#")).toList();
        } catch (IOException error) { throw new UncheckedIOException(error); }
    }
}
