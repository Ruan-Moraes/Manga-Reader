package com.mangareader.presentation.news.controller;

import java.util.List;

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
    @Operation(summary = "Listar notícias", description = "Retorna todas as notícias ordenadas por data")
    public ResponseEntity<ApiResponse<List<NewsResponse>>> getAll() {
        var news = getNewsUseCase.execute();
        return ResponseEntity.ok(ApiResponse.success(NewsMapper.toResponseList(news)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar notícia por ID")
    public ResponseEntity<ApiResponse<NewsResponse>> getById(@PathVariable String id) {
        var news = getNewsByIdUseCase.execute(id);
        return ResponseEntity.ok(ApiResponse.success(NewsMapper.toResponse(news)));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Filtrar notícias por categoria")
    public ResponseEntity<ApiResponse<List<NewsResponse>>> getByCategory(@PathVariable String category) {
        var cat = parseCategory(category);
        var news = getNewsByCategoryUseCase.execute(cat);
        return ResponseEntity.ok(ApiResponse.success(NewsMapper.toResponseList(news)));
    }

    @GetMapping("/search")
    @Operation(summary = "Pesquisar notícias por título")
    public ResponseEntity<ApiResponse<List<NewsResponse>>> search(@RequestParam String q) {
        var news = searchNewsUseCase.execute(q);
        return ResponseEntity.ok(ApiResponse.success(NewsMapper.toResponseList(news)));
    }

    // ── Helper ──────────────────────────────────────────────────────────────

    private NewsCategory parseCategory(String value) {
        for (NewsCategory cat : NewsCategory.values()) {
            if (cat.getDisplayName().equalsIgnoreCase(value) || cat.name().equalsIgnoreCase(value)) {
                return cat;
            }
        }
        throw new IllegalArgumentException("Categoria de notícia inválida: " + value);
    }
}
