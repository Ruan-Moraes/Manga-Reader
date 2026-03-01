package com.mangareader.domain.category.valueobject;

/**
 * Status de publicação de um título.
 * <p>
 * Compatível com o frontend ({@code PublicationStatus} em publication-status.types.ts).
 */
public enum PublicationStatus {
    COMPLETE,
    ONGOING,
    HIATUS,
    CANCELLED,
    ALL
}
