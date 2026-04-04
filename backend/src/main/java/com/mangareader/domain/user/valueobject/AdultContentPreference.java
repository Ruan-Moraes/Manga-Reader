package com.mangareader.domain.user.valueobject;

/**
 * Preferência do usuário para exibição de conteúdo adulto.
 * <ul>
 *   <li>{@code BLUR} — padrão, exibe com blur overlay</li>
 *   <li>{@code SHOW} — exibe normalmente sem restrição</li>
 *   <li>{@code HIDE} — esconde completamente de todas as listagens</li>
 * </ul>
 */
public enum AdultContentPreference {
    BLUR,
    SHOW,
    HIDE
}
