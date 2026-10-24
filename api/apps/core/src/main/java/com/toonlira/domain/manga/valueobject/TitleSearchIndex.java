package com.toonlira.domain.manga.valueobject;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Projeção derivada e reconstruível usada apenas para busca textual no MongoDB.
 * A fonte canônica continua sendo {@code Title.name}.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TitleSearchIndex {
    @Builder.Default
    private Map<String, String> normalizedNames = Map.of();

    @Builder.Default
    private List<String> normalizedAliases = List.of();

    @Builder.Default
    private List<String> grams = List.of();
}
