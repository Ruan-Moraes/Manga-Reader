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

import com.mangareader.application.news.usecase.admin.CreateNewsUseCase;
import com.mangareader.application.news.usecase.admin.CreateNewsUseCase.CreateNewsCommand;
import com.mangareader.application.news.usecase.admin.ChangeNewsStatusUseCase;
import com.mangareader.application.news.usecase.admin.DeleteNewsUseCase;
import com.mangareader.application.news.usecase.admin.GetAdminNewsUseCase;
import com.mangareader.application.news.usecase.admin.ListAdminNewsUseCase;
import com.mangareader.application.news.usecase.admin.UpdateNewsUseCase;
import com.mangareader.application.news.usecase.admin.UpdateNewsUseCase.UpdateNewsCommand;
import com.mangareader.domain.news.valueobject.NewsAuthor;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.domain.news.valueobject.NewsStatus;
import com.mangareader.presentation.admin.dto.AdminNewsResponse;
import com.mangareader.presentation.admin.dto.CreateNewsRequest;
import com.mangareader.presentation.admin.dto.UpdateNewsRequest;
import com.mangareader.presentation.admin.dto.ScheduleNewsRequest;
import com.mangareader.presentation.admin.mapper.AdminNewsMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints admin para gestão de notícias.
 */
@RestController
@RequestMapping("/api/admin/news")
@RequiredArgsConstructor
public class AdminNewsController {
    private final ListAdminNewsUseCase listAdminNewsUseCase;
    private final GetAdminNewsUseCase getAdminNewsUseCase;
    private final CreateNewsUseCase createNewsUseCase;
    private final UpdateNewsUseCase updateNewsUseCase;
    private final DeleteNewsUseCase deleteNewsUseCase;
    private final ChangeNewsStatusUseCase changeNewsStatusUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AdminNewsResponse>>> listNews(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "publishedAt") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        var dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        String sortField = switch (sort) {
            case "title", "category", "views", "status", "publishedAt", "scheduledAt", "updatedAt" -> sort;
            default -> throw new IllegalArgumentException("Ordenação de notícias inválida: " + sort);
        };

        Pageable pageable = PageRequest.of(page, Math.min(Math.max(size, 1), 100), Sort.by(dir, sortField));

        var result = listAdminNewsUseCase.execute(search, NewsStatus.fromValue(status),
                category == null || category.isBlank() ? null : NewsCategory.fromValue(category), pageable);

        var mapped = result.map(AdminNewsMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminNewsResponse>> getNewsDetail(@PathVariable String id) {
        var news = getAdminNewsUseCase.execute(id);

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

        NewsCategory category = NewsCategory.fromValue(request.category());

        var news = createNewsUseCase.execute(new CreateNewsCommand(
                request.title(), request.subtitle(), request.excerpt(), request.content(),
                request.slug(), request.coverImage(), request.coverAlt(), category, request.tags(),
                author, request.source(), request.readTime(), request.isExclusive(), request.isFeatured(),
                request.seoTitle(), request.seoDescription(), request.seoKeywords()));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(AdminNewsMapper.toResponse(news)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminNewsResponse>> updateNews(
            @PathVariable String id,
            @Valid @RequestBody UpdateNewsRequest request
    ) {
        NewsAuthor author = (request.authorName() != null || request.authorAvatar() != null)
                ? NewsAuthor.builder()
                        .name(request.authorName())
                        .avatar(request.authorAvatar())
                        .build()
                : null;

        NewsCategory category = request.category() != null
                ? NewsCategory.fromValue(request.category())
                : null;

        var news = updateNewsUseCase.execute(new UpdateNewsCommand(
                id, request.title(), request.subtitle(), request.excerpt(), request.content(),
                request.slug(), request.coverImage(), request.coverAlt(), category, request.tags(),
                author, request.source(), request.readTime(), request.isExclusive(), request.isFeatured(),
                request.seoTitle(), request.seoDescription(), request.seoKeywords()));

        return ResponseEntity.ok(ApiResponse.success(AdminNewsMapper.toResponse(news)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNews(@PathVariable String id) {
        deleteNewsUseCase.execute(id);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    public ResponseEntity<ApiResponse<AdminNewsResponse>> publish(@PathVariable String id) {
        return ok(changeNewsStatusUseCase.publish(id));
    }

    @PostMapping("/{id}/unpublish")
    public ResponseEntity<ApiResponse<AdminNewsResponse>> unpublish(@PathVariable String id) {
        return ok(changeNewsStatusUseCase.unpublish(id));
    }

    @PostMapping("/{id}/draft")
    public ResponseEntity<ApiResponse<AdminNewsResponse>> moveToDraft(@PathVariable String id) {
        return ok(changeNewsStatusUseCase.moveToDraft(id));
    }

    @PostMapping("/{id}/schedule")
    public ResponseEntity<ApiResponse<AdminNewsResponse>> schedule(
            @PathVariable String id, @Valid @RequestBody ScheduleNewsRequest request) {
        return ok(changeNewsStatusUseCase.schedule(id, request.scheduledAt()));
    }

    private static ResponseEntity<ApiResponse<AdminNewsResponse>> ok(NewsItem news) {
        return ResponseEntity.ok(ApiResponse.success(AdminNewsMapper.toResponse(news)));
    }
}
