package com.mangareader.domain.store.valueobject;

/**
 * Categoria de agrupamento de loja na aba Lojas. DT-46.
 * <p>
 * Compatível com o frontend ({@code Store.category} em store.types.ts:
 * {@code 'oficial' | 'nova' | 'usado'}).
 */
public enum StoreCategory {
    OFICIAL,
    NOVA,
    USADO;

    /**
     * Resolve a categoria a partir do nome do enum, case-insensitive
     * (aceita {@code "oficial"}/{@code "nova"}/{@code "usado"} do frontend).
     * Mantém o parsing no domínio, fora dos controllers (padrão DT-39).
     */
    public static StoreCategory fromValue(String value) {
        for (StoreCategory category : values()) {
            if (category.name().equalsIgnoreCase(value)) {
                return category;
            }
        }

        throw new IllegalArgumentException("Categoria de loja inválida: " + value);
    }
}
