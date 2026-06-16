package com.mangareader.presentation.manga.controller;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.manga.usecase.GetChapterByNumberUseCase;
import com.mangareader.application.manga.usecase.GetChaptersByTitleUseCase;
import com.mangareader.presentation.manga.dto.ChapterResponse;
import com.mangareader.presentation.shared.mapper.LocalizedMappingHelper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Controller de capítulos — sub-recurso de Titles.
 * <p>
 * Todos os endpoints são públicos (GET). Capítulos vivem em coleção própria
 * (DT-17) e a listagem é paginada de verdade no banco.
 */
@RestController
@RequestMapping("/api/titles/{titleId}/chapters")
@RequiredArgsConstructor
@Tag(name = "Chapters", description = "Capítulos de um título de mangá")
public class ChapterController {
    private final GetChaptersByTitleUseCase getChaptersByTitleUseCase;
    private final GetChapterByNumberUseCase getChapterByNumberUseCase;
    private final LocalizedMappingHelper i18n;

    @GetMapping
    @Operation(summary = "Listar capítulos", description = "Retorna os capítulos de um título com paginação")
    public ResponseEntity<ApiResponse<PageResponse<ChapterResponse>>> getAll(
            @PathVariable String titleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        var dir = "desc".equalsIgnoreCase(direction)
                ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, "number"));

        var result = getChaptersByTitleUseCase.execute(titleId, pageable)
                .map(ch -> new ChapterResponse(
                        ch.getNumber(),
                        i18n.toResolvedString(ch.getTitle()),
                        ch.getReleaseDate(),
                        ch.getPages()));

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }

    @GetMapping("/{number}")
    @Operation(summary = "Buscar capítulo", description = "Retorna um capítulo específico pelo número")
    public ResponseEntity<ApiResponse<ChapterResponse>> getByNumber(
            @PathVariable String titleId,
            @PathVariable String number
    ) {
        var ch = getChapterByNumberUseCase.execute(titleId, number);

        var response = new ChapterResponse(ch.getNumber(), i18n.toResolvedString(ch.getTitle()), ch.getReleaseDate(), ch.getPages());

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
