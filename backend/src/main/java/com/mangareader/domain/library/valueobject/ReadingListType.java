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
}
