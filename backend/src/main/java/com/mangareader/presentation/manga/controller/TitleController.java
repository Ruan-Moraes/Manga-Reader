package com.mangareader.presentation.manga.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.manga.usecase.ChapterStats;
import com.mangareader.application.manga.usecase.FilterTitlesUseCase;
import com.mangareader.application.manga.usecase.GetChapterStatsUseCase;
import com.mangareader.application.manga.usecase.GetTitleByIdUseCase;
import com.mangareader.application.manga.usecase.GetTitlesByGenreUseCase;
import com.mangareader.application.manga.usecase.GetTitlesUseCase;
import com.mangareader.application.manga.usecase.SearchTitlesUseCase;
import com.mangareader.domain.category.valueobject.SortCriteria;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.presentation.manga.dto.TitleResponse;
import com.mangareader.presentation.manga.mapper.TitleMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;
import com.mangareader.shared.web.PageParams;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Controller de títulos de mangá.
 * <p>
 * Todos os endpoints são públicos (GET).
 */
@RestController
@RequestMapping("/api/titles")
@RequiredArgsConstructor
@Tag(name = "Titles", description = "Catálogo de títulos de manga/manhwa/manhua")
public class TitleController {
    private final GetTitlesUseCase getTitlesUseCase;
    private final GetTitleByIdUseCase getTitleByIdUseCase;
    private final SearchTitlesUseCase searchTitlesUseCase;
    private final GetTitlesByGenreUseCase getTitlesByGenreUseCase;
    private final FilterTitlesUseCase filterTitlesUseCase;
    private final GetChapterStatsUseCase getChapterStatsUseCase;
    private final TitleMapper titleMapper;

    @GetMapping
    @Operation(summary = "Listar títulos", description = "Retorna todos os títulos do catálogo com paginação")
    public ResponseEntity<ApiResponse<PageResponse<TitleResponse>>> getAll(
            @PageParams(defaultSort = "name", defaultDirection = "asc")
            Pageable pageable
    ) {
        var result = getTitlesUseCase.execute(pageable);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapWithStats(result))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar título por ID", description = "Retorna os detalhes de um título específico")
    public ResponseEntity<ApiResponse<TitleResponse>> getById(@PathVariable String id) {
        var title = getTitleByIdUseCase.execute(id);

        var stats = getChapterStatsUseCase.execute(List.of(id))
                .getOrDefault(id, ChapterStats.EMPTY);

        return ResponseEntity.ok(ApiResponse.success(titleMapper.toResponse(title, stats)));
    }

    @GetMapping("/search")
    @Operation(summary = "Pesquisar títulos", description = "Busca títulos por nome (pesquisa parcial)")
    public ResponseEntity<ApiResponse<PageResponse<TitleResponse>>> search(
            @RequestParam(defaultValue = "") String q,
            @PageParams(defaultSort = "name", defaultDirection = "asc",
                    ignoreRequestSort = true)
            Pageable pageable
    ) {
        var result = searchTitlesUseCase.execute(q, pageable);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapWithStats(result))));
    }

    @GetMapping("/genre/{genre}")
    @Operation(summary = "Filtrar por gênero", description = "Retorna títulos que contêm o gênero especificado")
    public ResponseEntity<ApiResponse<PageResponse<TitleResponse>>> getByGenre(
            @PathVariable String genre,
            @PageParams(defaultSort = "name", defaultDirection = "asc",
                    ignoreRequestSort = true)
            Pageable pageable
    ) {
        var result = getTitlesByGenreUseCase.execute(genre, pageable);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapWithStats(result))));
    }

    @GetMapping("/filter")
    @Operation(summary = "Busca avançada", description = "Filtra títulos por gêneros, status, conteúdo adulto e critério de ordenação")
    public ResponseEntity<ApiResponse<PageResponse<TitleResponse>>> filter(
            @RequestParam(required = false) List<String> genres,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean adult,
            @RequestParam(required = false, defaultValue = "MOST_READ") String sort,
            @PageParams(defaultSort = "name", defaultDirection = "asc",
                    ignoreRequestSort = true)
            Pageable pageable
    ) {
        SortCriteria sortCriteria;

        try {
            sortCriteria = SortCriteria.valueOf(sort.toUpperCase());
        } catch (IllegalArgumentException e) {
            sortCriteria = SortCriteria.MOST_READ;
        }

        var result = filterTitlesUseCase.execute(genres, status, adult, sortCriteria, pageable);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapWithStats(result))));
    }

    private Page<TitleResponse> mapWithStats(Page<Title> result) {
        var titleIds = result.getContent().stream().map(Title::getId).toList();

        var stats = getChapterStatsUseCase.execute(titleIds);

        return result.map(title -> titleMapper.toResponse(
                title, stats.getOrDefault(title.getId(), ChapterStats.EMPTY)));
    }
}
