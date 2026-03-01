package com.mangareader.presentation.manga.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.manga.usecase.GetTitleByIdUseCase;
import com.mangareader.application.manga.usecase.GetTitlesByGenreUseCase;
import com.mangareader.application.manga.usecase.GetTitlesUseCase;
import com.mangareader.application.manga.usecase.SearchTitlesUseCase;
import com.mangareader.presentation.manga.dto.TitleResponse;
import com.mangareader.presentation.manga.mapper.TitleMapper;
import com.mangareader.shared.dto.ApiResponse;

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

    @GetMapping
    @Operation(summary = "Listar títulos", description = "Retorna todos os títulos do catálogo")
    public ResponseEntity<ApiResponse<List<TitleResponse>>> getAll() {
        var titles = getTitlesUseCase.execute();
        return ResponseEntity.ok(ApiResponse.success(TitleMapper.toResponseList(titles)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar título por ID", description = "Retorna os detalhes de um título específico")
    public ResponseEntity<ApiResponse<TitleResponse>> getById(@PathVariable String id) {
        var title = getTitleByIdUseCase.execute(id);
        return ResponseEntity.ok(ApiResponse.success(TitleMapper.toResponse(title)));
    }

    @GetMapping("/search")
    @Operation(summary = "Pesquisar títulos", description = "Busca títulos por nome (pesquisa parcial)")
    public ResponseEntity<ApiResponse<List<TitleResponse>>> search(
            @RequestParam(defaultValue = "") String q
    ) {
        var titles = searchTitlesUseCase.execute(q);
        return ResponseEntity.ok(ApiResponse.success(TitleMapper.toResponseList(titles)));
    }

    @GetMapping("/genre/{genre}")
    @Operation(summary = "Filtrar por gênero", description = "Retorna títulos que contêm o gênero especificado")
    public ResponseEntity<ApiResponse<List<TitleResponse>>> getByGenre(@PathVariable String genre) {
        var titles = getTitlesByGenreUseCase.execute(genre);
        return ResponseEntity.ok(ApiResponse.success(TitleMapper.toResponseList(titles)));
    }
}
