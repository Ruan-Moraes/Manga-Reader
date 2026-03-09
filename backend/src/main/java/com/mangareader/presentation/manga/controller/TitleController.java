package com.mangareader.presentation.manga.controller;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.manga.usecase.FilterTitlesUseCase;
import com.mangareader.application.manga.usecase.GetTitleByIdUseCase;
import com.mangareader.application.manga.usecase.GetTitlesByGenreUseCase;
import com.mangareader.application.manga.usecase.GetTitlesUseCase;
import com.mangareader.application.manga.usecase.SearchTitlesUseCase;
import com.mangareader.domain.category.valueobject.SortCriteria;
import com.mangareader.presentation.manga.dto.TitleResponse;
import com.mangareader.presentation.manga.mapper.TitleMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

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

    @GetMapping
    @Operation(summary = "Listar títulos", description = "Retorna todos os títulos do catálogo com paginação")
    public ResponseEntity<ApiResponse<PageResponse<TitleResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sort,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        var pageable = buildPageable(page, size, sort, direction);

        var result = getTitlesUseCase.execute(pageable);

        var mapped = result.map(TitleMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar título por ID", description = "Retorna os detalhes de um título específico")
    public ResponseEntity<ApiResponse<TitleResponse>> getById(@PathVariable String id) {
        var title = getTitleByIdUseCase.execute(id);
        return ResponseEntity.ok(ApiResponse.success(TitleMapper.toResponse(title)));
    }

    @GetMapping("/search")
    @Operation(summary = "Pesquisar títulos", description = "Busca títulos por nome (pesquisa parcial)")
    public ResponseEntity<ApiResponse<PageResponse<TitleResponse>>> search(
            @RequestParam(defaultValue = "") String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var pageable = buildPageable(page, size, "name", "asc");

        var result = searchTitlesUseCase.execute(q, pageable);

        var mapped = result.map(TitleMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/genre/{genre}")
    @Operation(summary = "Filtrar por gênero", description = "Retorna títulos que contêm o gênero especificado")
    public ResponseEntity<ApiResponse<PageResponse<TitleResponse>>> getByGenre(
            @PathVariable String genre,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var pageable = buildPageable(page, size, "name", "asc");

        var result = getTitlesByGenreUseCase.execute(genre, pageable);

        var mapped = result.map(TitleMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/filter")
    @Operation(summary = "Busca avançada", description = "Filtra títulos por múltiplos gêneros/tags e critério de ordenação")
    public ResponseEntity<ApiResponse<PageResponse<TitleResponse>>> filter(
            @RequestParam(required = false) List<String> genres,
            @RequestParam(required = false, defaultValue = "MOST_READ") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        SortCriteria sortCriteria;

        try {
            sortCriteria = SortCriteria.valueOf(sort.toUpperCase());
        } catch (IllegalArgumentException e) {
            sortCriteria = SortCriteria.MOST_READ;
        }

        var pageable = buildPageable(page, size, "name", "asc");

        var result = filterTitlesUseCase.execute(genres, sortCriteria, pageable);

        var mapped = result.map(TitleMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    // TODO: Retirar essa lógica do controller
    private Pageable buildPageable(int page, int size, String sort, String direction) {
        var dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;

        return PageRequest.of(page, size, Sort.by(dir, sort));
    }
}
