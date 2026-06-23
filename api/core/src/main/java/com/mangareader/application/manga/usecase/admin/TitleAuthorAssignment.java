package com.mangareader.application.manga.usecase.admin;

import com.mangareader.domain.author.valueobject.AuthorRole;

/**
 * Atribuição de um autor a um título com seu papel. Entrada dos use cases de título.
 */
public record TitleAuthorAssignment(Long authorId, AuthorRole role) {
}
