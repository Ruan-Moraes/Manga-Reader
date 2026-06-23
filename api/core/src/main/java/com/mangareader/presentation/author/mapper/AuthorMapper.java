package com.mangareader.presentation.author.mapper;

import com.mangareader.domain.author.entity.Author;
import com.mangareader.presentation.author.dto.AuthorResponse;

/**
 * Mapper estático Author → AuthorResponse.
 */
public final class AuthorMapper {

    private AuthorMapper() {
    }

    public static AuthorResponse toResponse(Author author) {
        if (author == null) return null;

        return new AuthorResponse(
                author.getId(),
                author.getName(),
                author.getSlug(),
                author.getBio(),
                author.getNationality(),
                author.getCreatedAt(),
                author.getUpdatedAt()
        );
    }
}
