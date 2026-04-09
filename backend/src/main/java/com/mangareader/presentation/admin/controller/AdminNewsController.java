package com.mangareader.presentation.admin.controller;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.application.news.usecase.admin.CreateNewsUseCase;
import com.mangareader.application.news.usecase.admin.DeleteNewsUseCase;
import com.mangareader.application.news.usecase.admin.UpdateNewsUseCase;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.presentation.admin.dto.AdminNewsResponse;
import com.mangareader.presentation.admin.dto.CreateNewsRequest;
import com.mangareader.presentation.admin.dto.UpdateNewsRequest;
import com.mangareader.presentation.admin.mapper.AdminNewsMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;
import com.mangareader.shared.exception.ResourceNotFoundException;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints admin para gestão de notícias.
 */
@RestController
@RequestMapping("/api/admin/news")
@RequiredArgsConstructor
public class AdminNewsController {

    private final NewsRepositoryPort newsRepository;
    private final CreateNewsUseCase createNewsUseCase;
    private final UpdateNewsUseCase updateNewsUseCase;
    private final DeleteNewsUseCase deleteNewsUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminNewsResponse>>> listNews(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "publishedAt") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        var dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sort));

        var result = (search != null && !search.isBlank())
                ? newsRepository.searchByTitle(search, pageable)
                : newsRepository.findAll(pageable);

        var mapped = result.map(AdminNewsMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminNewsResponse>> getNewsDetail(@PathVariable String id) {
        var news = newsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("News", "id", id));

        return ResponseEntity.ok(ApiResponse.success(AdminNewsMapper.toResponse(news)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminNewsResponse>> createNews(
            @Valid @RequestBody CreateNewsRequest request
    ) {
        NewsAuthor author = NewsAuthor.builder()
                .name(request.authorName())
                .avatar(request.authorAvatar())
                .build();

        NewsCategory category = NewsCategory.valueOf(request.category().toUpperCase());

        var news = createNewsUseCase.execute(
                request.title(), request.subtitle(), request.excerpt(),
                request.content(), request.coverImage(), category,
                request.tags(), author, request.source(),
                request.readTime(), request.isExclusive(), request.isFeatured()
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(AdminNewsMapper.toResponse(news)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminNewsResponse>> updateNews(
            @PathVariable String id,
            @RequestBody UpdateNewsRequest request
    ) {
        NewsAuthor author = (request.authorName() != null || request.authorAvatar() != null)
                ? NewsAuthor.builder()
                        .name(request.authorName())
                        .avatar(request.authorAvatar())
                        .build()
                : null;

        NewsCategory category = request.category() != null
                ? NewsCategory.valueOf(request.category().toUpperCase())
                : null;

        var news = updateNewsUseCase.execute(
                id, request.title(), request.subtitle(), request.excerpt(),
                request.content(), request.coverImage(), category,
                request.tags(), author, request.source(),
                request.readTime(), request.isExclusive(), request.isFeatured()
        );

        return ResponseEntity.ok(ApiResponse.success(AdminNewsMapper.toResponse(news)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNews(@PathVariable String id) {
        deleteNewsUseCase.execute(id);
        return ResponseEntity.noContent().build();
    }
}
