package com.mangareader.presentation.author.mapper;

import com.mangareader.domain.author.entity.Author;
import com.mangareader.presentation.author.dto.AuthorResponse;
import com.mangareader.presentation.author.dto.AuthorAliasResponse;
import com.mangareader.domain.author.valueobject.AuthorRole;
import java.util.List;

/**
 * Mapper estático Author → AuthorResponse.
 */
public final class AuthorMapper {

    private AuthorMapper() {
    }

    public static AuthorResponse toResponse(Author author) {
        return toResponse(author, List.of());
    }

    public static AuthorResponse toResponse(Author author, List<AuthorRole> roles) {
        if (author == null) return null;

        return new AuthorResponse(
                author.getId(),
                author.getName(),
                author.getSlug(),
                author.getBio(),
                author.getNationality(),
                author.getImageUrl(),
                author.getAliases().stream()
                        .map(alias -> new AuthorAliasResponse(
                                alias.getId(), alias.getName(), alias.getType()))
                        .toList(),
                roles,
                author.getCreatedAt(),
                author.getUpdatedAt()
        );
    }
}
