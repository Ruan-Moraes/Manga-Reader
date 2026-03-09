package com.mangareader.domain.forum.valueobject;

/**
 * Categoria de tópico no fórum.
 * <p>
 * Compatível com o frontend ({@code ForumCategory} em forum.types.ts).
 */
public enum ForumCategory {
    GERAL("Geral"),
    RECOMENDACOES("Recomendações"),
    SPOILERS("Spoilers"),
    SUPORTE("Suporte"),
    OFF_TOPIC("Off-topic"),
    TEORIAS("Teorias"),
    FANART("Fanart"),
    NOTICIAS("Notícias");

    private final String displayName;

    ForumCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
