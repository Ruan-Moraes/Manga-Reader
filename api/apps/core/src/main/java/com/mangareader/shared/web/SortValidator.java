package com.mangareader.shared.web;

import java.util.Set;

import com.mangareader.shared.exception.BusinessRuleException;

/**
 * Valida o parâmetro {@code sort} de endpoints contra uma whitelist de
 * colunas/atributos suportados. Previne tentativas de ordenar por campos
 * JSONB i18n (que falhariam em runtime no PostgreSQL/Hibernate) ou por
 * campos não-indexados.
 *
 * <p>Uso típico:
 * <pre>{@code
 * private static final Set<String> SORTABLE_FIELDS = Set.of("id", "createdAt", "rating");
 * SortValidator.validate(sort, SORTABLE_FIELDS);
 * }</pre>
 */
public final class SortValidator {

    private SortValidator() {
    }

    public static void validate(String sort, Set<String> allowedFields) {
        if (sort == null || sort.isBlank()) {
            return;
        }
        if (!allowedFields.contains(sort)) {
            throw new BusinessRuleException(
                    "Invalid sort field '" + sort + "'. Allowed: " + allowedFields,
                    400);
        }
    }
}
