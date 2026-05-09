package com.mangareader.shared.application.i18n;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * Valida que um {@code Map<String, String>} contém todas as chaves de idioma
 * obrigatórias e que cada uma tem valor não em branco.
 *
 * <p>Aplicável a DTOs admin que recebem traduções como mapa BCP 47 → texto.
 * Por padrão exige apenas {@code "pt-BR"} (fallback do sistema).
 *
 * <pre>
 * &#064;RequiredLanguages
 * private Map&lt;String, String&gt; name;
 * </pre>
 */
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = RequiredLanguagesValidator.class)
public @interface RequiredLanguages {
    String[] value() default {"pt-BR"};

    String message() default "{validation.i18n.requiredLanguages}";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
