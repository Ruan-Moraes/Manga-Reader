package com.mangareader.domain.library.valueobject;

/**
 * Tipo de lista de leitura na biblioteca do usuário.
 * <p>
 * Compatível com o frontend ({@code ReadingListType} em saved-library.types.ts).
 */
public enum ReadingListType {
    LENDO("Lendo"),
    QUERO_LER("Quero Ler"),
    CONCLUIDO("Concluído");

    private final String displayName;

    ReadingListType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Resolve um tipo a partir do {@code displayName} (ex.: "Quero Ler") ou do nome
     * do enum, case-insensitive. Mantém o parsing no domínio, fora dos controllers.
     */
    public static ReadingListType fromValue(String value) {
        for (ReadingListType type : values()) {
            if (type.displayName.equalsIgnoreCase(value) || type.name().equalsIgnoreCase(value)) {
                return type;
            }
        }

        throw new IllegalArgumentException("Tipo de lista de leitura inválido: " + value);
    }
}
