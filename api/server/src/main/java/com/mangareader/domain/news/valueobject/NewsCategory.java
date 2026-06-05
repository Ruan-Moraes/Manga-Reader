package com.mangareader.domain.news.valueobject;

/**
 * Categoria de notícia.
 * <p>
 * Compatível com o frontend ({@code NewsCategory} em news.types.ts).
 */
public enum NewsCategory {
    PRINCIPAIS("Principais"),
    LANCAMENTOS("Lançamentos"),
    ADAPTACOES("Adaptações"),
    INDUSTRIA("Indústria"),
    ENTREVISTAS("Entrevistas"),
    EVENTOS("Eventos"),
    CURIOSIDADES("Curiosidades"),
    MERCADO("Mercado"),
    INTERNACIONAL("Internacional");

    private final String displayName;

    NewsCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Resolve uma categoria a partir do {@code displayName} ou do nome do enum,
     * case-insensitive. Mantém o parsing no domínio, fora dos controllers.
     */
    public static NewsCategory fromValue(String value) {
        for (NewsCategory category : values()) {
            if (category.displayName.equalsIgnoreCase(value) || category.name().equalsIgnoreCase(value)) {
                return category;
            }
        }

        throw new IllegalArgumentException("Categoria de notícia inválida: " + value);
    }
}
