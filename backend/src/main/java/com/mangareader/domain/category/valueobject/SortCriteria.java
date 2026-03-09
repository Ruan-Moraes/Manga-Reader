package com.mangareader.domain.category.valueobject;

/**
 * Critérios de ordenação para listagem de títulos.
 * <p>
 * Compatível com o frontend ({@code Sort} em sort.types.ts).
 */
public enum SortCriteria {
    MOST_READ,
    MOST_RATED,
    MOST_RECENT,
    ALPHABETICAL,
    ASCENSION,
    RANDOM
}
