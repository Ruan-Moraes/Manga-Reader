package com.mangareader.presentation.author.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.author.usecase.GetAuthorUseCase;
import com.mangareader.application.author.usecase.GetAuthorWorksUseCase;
import com.mangareader.application.author.port.TitleAuthorRepositoryPort;
import com.mangareader.presentation.search.dto.RelatedTitleResponse;
import com.mangareader.presentation.search.mapper.RelatedTitleMapper;
import com.mangareader.shared.web.CurrentUserId;
import com.mangareader.shared.web.PageParams;
import com.mangareader.domain.search.valueobject.GlobalSearchEntityType;
import com.mangareader.application.author.usecase.ListAuthorsUseCase;
import com.mangareader.presentation.author.dto.AuthorResponse;
import com.mangareader.presentation.author.mapper.AuthorMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

import lombok.RequiredArgsConstructor;

/**
 * Endpoints REST públicos para autores.
 */
@RestController
@RequestMapping("/api/authors")
@RequiredArgsConstructor
public class AuthorController {
    private final ListAuthorsUseCase listAuthorsUseCase;
    private final GetAuthorUseCase getAuthorUseCase;
    private final GetAuthorWorksUseCase getAuthorWorksUseCase;
    private final TitleAuthorRepositoryPort titleAuthorRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AuthorResponse>>> list(
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"));

        var result = listAuthorsUseCase.execute(name, pageable);
        var mapped = result.map(AuthorMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AuthorResponse>> getById(@PathVariable Long id) {
        var author = getAuthorUseCase.execute(id);

        return ResponseEntity.ok(ApiResponse.success(AuthorMapper.toResponse(author)));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ApiResponse<AuthorResponse>> getBySlug(
            @PathVariable String slug) {
        var author = getAuthorUseCase.executeBySlug(slug);
        var roles = titleAuthorRepository.findByAuthorIdIn(List.of(author.getId()))
                .stream()
                .map(credit -> credit.getRole())
                .distinct()
                .toList();
        return ResponseEntity.ok(ApiResponse.success(AuthorMapper.toResponse(author, roles)));
    }

    @GetMapping("/{id}/works")
    public ResponseEntity<ApiResponse<PageResponse<RelatedTitleResponse>>> getWorks(
            @PathVariable Long id,
            @RequestParam(required = false) GlobalSearchEntityType kind,
            @PageParams(defaultSort = "name", defaultDirection = "asc",
                    ignoreRequestSort = true)
            Pageable pageable,
            @CurrentUserId UUID userId) {
        var result = getAuthorWorksUseCase.execute(id, kind, pageable, userId)
                .map(RelatedTitleMapper::toResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }
}
