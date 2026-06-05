package com.mangareader.presentation.news.controller;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.news.usecase.GetNewsByCategoryUseCase;
import com.mangareader.application.news.usecase.GetNewsByIdUseCase;
import com.mangareader.application.news.usecase.GetNewsUseCase;
import com.mangareader.application.news.usecase.SearchNewsUseCase;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.presentation.news.dto.NewsResponse;
import com.mangareader.presentation.news.mapper.NewsMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;
import com.mangareader.shared.web.PageParams;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Controller de notícias — totalmente público.
 */
@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
@Tag(name = "News", description = "Notícias da plataforma")
public class NewsController {

    private final GetNewsUseCase getNewsUseCase;
    private final GetNewsByIdUseCase getNewsByIdUseCase;
    private final GetNewsByCategoryUseCase getNewsByCategoryUseCase;
    private final SearchNewsUseCase searchNewsUseCase;
    private final NewsMapper newsMapper;

    @GetMapping
    @Operation(summary = "Listar notícias", description = "Retorna notícias com paginação")
    public ResponseEntity<ApiResponse<PageResponse<NewsResponse>>> getAll(
            @PageParams(defaultSort = "publishedAt", defaultDirection = "desc")
            Pageable pageable
    ) {
        var result = getNewsUseCase.execute(pageable);

        var mapped = result.map(newsMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar notícia por ID")
    public ResponseEntity<ApiResponse<NewsResponse>> getById(@PathVariable String id) {
        var news = getNewsByIdUseCase.execute(id);
        return ResponseEntity.ok(ApiResponse.success(newsMapper.toResponse(news)));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Filtrar notícias por categoria")
    public ResponseEntity<ApiResponse<PageResponse<NewsResponse>>> getByCategory(
            @PathVariable String category,
            @PageParams(defaultSort = "publishedAt", defaultDirection = "desc",
                    ignoreRequestSort = true)
            Pageable pageable
    ) {
        var cat = NewsCategory.fromValue(category);

        var result = getNewsByCategoryUseCase.execute(cat, pageable);

        var mapped = result.map(newsMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/search")
    @Operation(summary = "Pesquisar notícias por título")
    public ResponseEntity<ApiResponse<PageResponse<NewsResponse>>> search(
            @RequestParam String q,
            @PageParams(defaultSort = "publishedAt", defaultDirection = "desc",
                    ignoreRequestSort = true)
            Pageable pageable
    ) {
        var result = searchNewsUseCase.execute(q, pageable);

        var mapped = result.map(newsMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }
}
