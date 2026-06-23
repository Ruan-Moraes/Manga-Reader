package com.mangareader.domain.group.valueobject;

/**
 * Papel de um membro dentro de um grupo.
 * <p>
 * Valores compatíveis com o frontend ({@code GroupRole} em group.types.ts).
 */
public enum GroupRole {
    LIDER("Líder"),
    TRADUTOR("Tradutor(a)"),
    REVISOR("Revisor(a)"),
    QC("QC"),
    CLEANER("Cleaner"),
    TYPESETTER("Typesetter");

    private final String displayName;

    GroupRole(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
