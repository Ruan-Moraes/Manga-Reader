package com.mangareader.presentation.manga.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.manga.usecase.GetChapterByNumberUseCase;
import com.mangareader.application.manga.usecase.GetChaptersByTitleUseCase;
import com.mangareader.presentation.manga.dto.ChapterResponse;
import com.mangareader.shared.dto.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Controller de capítulos — sub-recurso de Titles.
 * <p>
 * Todos os endpoints são públicos (GET).
 */
@RestController
@RequestMapping("/api/titles/{titleId}/chapters")
@RequiredArgsConstructor
@Tag(name = "Chapters", description = "Capítulos de um título de mangá")
public class ChapterController {
    private final GetChaptersByTitleUseCase getChaptersByTitleUseCase;
    private final GetChapterByNumberUseCase getChapterByNumberUseCase;

    @GetMapping
    @Operation(summary = "Listar capítulos", description = "Retorna todos os capítulos de um título")
    public ResponseEntity<ApiResponse<List<ChapterResponse>>> getAll(
            @PathVariable String titleId
    ) {
        var chapters = getChaptersByTitleUseCase.execute(titleId);

        var response = chapters.stream()
                .map(ch -> new ChapterResponse(ch.getNumber(), ch.getTitle(), ch.getReleaseDate(), ch.getPages()))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{number}")
    @Operation(summary = "Buscar capítulo", description = "Retorna um capítulo específico pelo número")
    public ResponseEntity<ApiResponse<ChapterResponse>> getByNumber(
            @PathVariable String titleId,
            @PathVariable String number
    ) {
        var ch = getChapterByNumberUseCase.execute(titleId, number);

        var response = new ChapterResponse(ch.getNumber(), ch.getTitle(), ch.getReleaseDate(), ch.getPages());

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
