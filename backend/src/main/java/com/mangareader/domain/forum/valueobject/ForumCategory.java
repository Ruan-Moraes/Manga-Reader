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

    /**
     * Resolve uma categoria a partir do {@code displayName} ou do nome do enum,
     * case-insensitive. Mantém o parsing no domínio, fora dos controllers.
     */
    public static ForumCategory fromValue(String value) {
        for (ForumCategory category : values()) {
            if (category.displayName.equalsIgnoreCase(value) || category.name().equalsIgnoreCase(value)) {
                return category;
            }
        }

        throw new IllegalArgumentException("Categoria de fórum inválida: " + value);
    }
}
