package com.mangareader.presentation.news.controller;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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

    @GetMapping
    @Operation(summary = "Listar notícias", description = "Retorna notícias com paginação")
    public ResponseEntity<ApiResponse<PageResponse<NewsResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "publishedAt") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        var pageable = buildPageable(page, size, sort, direction);

        var result = getNewsUseCase.execute(pageable);

        var mapped = result.map(NewsMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar notícia por ID")
    public ResponseEntity<ApiResponse<NewsResponse>> getById(@PathVariable String id) {
        var news = getNewsByIdUseCase.execute(id);
        return ResponseEntity.ok(ApiResponse.success(NewsMapper.toResponse(news)));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Filtrar notícias por categoria")
    public ResponseEntity<ApiResponse<PageResponse<NewsResponse>>> getByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var cat = parseCategory(category);

        var pageable = buildPageable(page, size, "publishedAt", "desc");

        var result = getNewsByCategoryUseCase.execute(cat, pageable);

        var mapped = result.map(NewsMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/search")
    @Operation(summary = "Pesquisar notícias por título")
    public ResponseEntity<ApiResponse<PageResponse<NewsResponse>>> search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var pageable = buildPageable(page, size, "publishedAt", "desc");

        var result = searchNewsUseCase.execute(q, pageable);

        var mapped = result.map(NewsMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    // TODO: Esses métodos de parsing e construção de Pageable podem ser extraídos para componentes de utilitário ou similares para evitar repetição em outros controllers
    private NewsCategory parseCategory(String value) {
        for (NewsCategory cat : NewsCategory.values()) {
            if (cat.getDisplayName().equalsIgnoreCase(value) || cat.name().equalsIgnoreCase(value)) {
                return cat;
            }
        }

        throw new IllegalArgumentException("Categoria de notícia inválida: " + value);
    }

    private Pageable buildPageable(int page, int size, String sort, String direction) {
        var dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;

        return PageRequest.of(page, size, Sort.by(dir, sort));
    }
}
