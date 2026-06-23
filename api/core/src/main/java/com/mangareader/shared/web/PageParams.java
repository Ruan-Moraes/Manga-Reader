package com.mangareader.shared.web;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marca um parâmetro {@link org.springframework.data.domain.Pageable} resolvido
 * por {@link PageableArgumentResolver} a partir dos query params
 * {@code page}/{@code size}/{@code sort}/{@code direction}.
 *
 * <p>Substitui o método privado {@code buildPageable(...)} antes duplicado em
 * todos os controllers (DRY + controller sem lógica).
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
public @interface PageParams {
    /** Tamanho de página default quando {@code size} não vem na query. */
    int defaultSize() default 20;

    /** Campo de ordenação default quando {@code sort} não vem na query. */
    String defaultSort() default "id";

    /** Direção default ({@code asc}/{@code desc}) quando ausente na query. */
    String defaultDirection() default "desc";

    /**
     * Whitelist de campos ordenáveis. Vazio = sem validação. Não-vazio →
     * delega a {@link SortValidator#validate(String, java.util.Set)} (HTTP 400
     * para campo fora da lista).
     */
    String[] allow() default {};

    /**
     * Quando {@code true}, o {@code sort} da query é ignorado (usa só
     * {@link #defaultSort()}). Para endpoints onde {@code sort} é um token
     * semântico consumido pelo use case (ex.: {@code MOST_READ}).
     */
    boolean ignoreRequestSort() default false;
}
