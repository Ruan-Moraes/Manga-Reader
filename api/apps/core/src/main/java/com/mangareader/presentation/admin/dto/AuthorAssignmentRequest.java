package com.mangareader.presentation.admin.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Atribuição de autor a um título no request. {@code role} opcional (default AUTHOR);
 * valores aceitos espelham {@code AuthorRole}.
 */
public record AuthorAssignmentRequest(
        @NotNull(message = "{validation.titleAuthor.authorId.required}")
        Long authorId,
        String role
) {
}
