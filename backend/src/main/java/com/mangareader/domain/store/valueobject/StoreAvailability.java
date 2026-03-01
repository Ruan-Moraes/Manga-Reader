package com.mangareader.domain.store.valueobject;

/**
 * Disponibilidade de um produto na loja.
 * <p>
 * Compatível com o frontend ({@code Store.availability} em store.types.ts).
 */
public enum StoreAvailability {
    IN_STOCK,
    OUT_OF_STOCK,
    PRE_ORDER
}
