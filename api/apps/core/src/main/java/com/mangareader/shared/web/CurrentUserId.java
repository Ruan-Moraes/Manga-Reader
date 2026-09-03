package com.mangareader.shared.web;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Injeta o {@code UUID} do usuário autenticado (principal da request) num
 * parâmetro de controller. Resolvido por {@link CurrentUserIdArgumentResolver}.
 *
 * <p>Substitui o método privado {@code extractUserId(Authentication)} antes
 * duplicado nos controllers (DRY + controller sem lógica).
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface CurrentUserId {
}
