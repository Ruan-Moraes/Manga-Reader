package com.mangareader.domain.user.valueobject;

/**
 * Controla a visibilidade de seções do perfil do usuário.
 * <ul>
 *   <li>{@code PUBLIC} — visível para todos</li>
 *   <li>{@code PRIVATE} — visível apenas para o dono</li>
 *   <li>{@code DO_NOT_TRACK} — dados não coletados</li>
 * </ul>
 */
public enum VisibilitySetting {
    PUBLIC,
    PRIVATE,
    DO_NOT_TRACK
}
