package com.mangareader.domain.manga.valueobject;

/**
 * Status de publicação de um título.
 * <p>
 * Os labels exibíveis são resolvidos por {@code DomainLabel}
 * (tipo {@code publication_status}) conforme a i18n DB-backed; este enum
 * representa apenas os códigos canônicos persistidos em {@code Title.status}.
 */
public enum PublicationStatus {
    ONGOING,
    COMPLETED,
    HIATUS,
    CANCELLED
}
