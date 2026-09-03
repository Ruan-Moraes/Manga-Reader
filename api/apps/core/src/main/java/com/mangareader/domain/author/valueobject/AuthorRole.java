package com.mangareader.domain.author.valueobject;

/**
 * Papel de um autor em relação a um título.
 * <p>
 * Persistido como STRING; espelha o CHECK constraint de {@code title_authors.role}.
 */
public enum AuthorRole {
    AUTHOR,
    ARTIST,
    STORY,
    LETTERER,
    COLORIST,
    EDITOR
}
