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
}
