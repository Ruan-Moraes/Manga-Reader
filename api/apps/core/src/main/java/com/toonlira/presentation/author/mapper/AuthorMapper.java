package com.toonlira.presentation.author.mapper;

import com.toonlira.domain.author.entity.Author;
import com.toonlira.presentation.author.dto.AuthorResponse;
import com.toonlira.presentation.author.dto.AuthorAliasResponse;
import com.toonlira.domain.author.valueobject.AuthorRole;
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
