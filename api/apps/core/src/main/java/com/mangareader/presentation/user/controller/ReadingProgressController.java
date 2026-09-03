package com.mangareader.presentation.user.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.user.usecase.GetLatestReadingProgressUseCase;
import com.mangareader.application.user.usecase.SaveReadingProgressUseCase;
import com.mangareader.presentation.user.dto.ReadingProgressResponse;
import com.mangareader.presentation.user.dto.SaveReadingProgressRequest;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.web.CurrentUserId;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Progresso de leitura (página atual / conclusão de capítulo) do usuário
 * autenticado.
 */
@RestController
@RequestMapping("/api/users/me/reading-progress")
@RequiredArgsConstructor
@Tag(name = "Reading Progress", description = "Progresso de leitura do usuário autenticado")
public class ReadingProgressController {
    private final SaveReadingProgressUseCase saveReadingProgressUseCase;
    private final GetLatestReadingProgressUseCase getLatestReadingProgressUseCase;

    @PutMapping
    @Operation(summary = "Salvar progresso de leitura", description = "Upsert de página atual / conclusão de um capítulo")
    public ResponseEntity<ApiResponse<ReadingProgressResponse>> save(
            @Valid @RequestBody SaveReadingProgressRequest request,
            @CurrentUserId UUID userId
    ) {
        var input = new SaveReadingProgressUseCase.SaveProgressInput(
                userId,
                request.titleId(),
                request.chapterNumber(),
                request.currentPage(),
                request.totalPages(),
                request.completed()
        );

        var saved = saveReadingProgressUseCase.execute(input);

        return ResponseEntity.ok(ApiResponse.success(ReadingProgressResponse.from(saved)));
    }

    @GetMapping("/{titleId}")
    @Operation(summary = "Progresso mais recente de um título", description = "Retorna o progresso do capítulo lido mais recentemente, para restaurar a leitura")
    public ResponseEntity<ApiResponse<ReadingProgressResponse>> getLatest(
            @PathVariable String titleId,
            @CurrentUserId UUID userId
    ) {
        return getLatestReadingProgressUseCase.execute(userId, titleId)
                .map(progress -> ResponseEntity.ok(ApiResponse.success(ReadingProgressResponse.from(progress))))
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success(null)));
    }
}
