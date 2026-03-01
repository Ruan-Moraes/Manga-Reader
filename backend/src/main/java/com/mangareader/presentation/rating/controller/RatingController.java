package com.mangareader.presentation.rating.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.rating.usecase.DeleteRatingUseCase;
import com.mangareader.application.rating.usecase.GetRatingAverageUseCase;
import com.mangareader.application.rating.usecase.GetRatingsByTitleUseCase;
import com.mangareader.application.rating.usecase.GetUserRatingsUseCase;
import com.mangareader.application.rating.usecase.SubmitRatingUseCase;
import com.mangareader.presentation.rating.dto.RatingAverageResponse;
import com.mangareader.presentation.rating.dto.RatingResponse;
import com.mangareader.presentation.rating.dto.SubmitRatingRequest;
import com.mangareader.presentation.rating.mapper.RatingMapper;
import com.mangareader.shared.dto.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller de avaliações.
 * <p>
 * GET (listar) é público; POST/DELETE requerem autenticação.
 */
@RestController
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
@Tag(name = "Ratings", description = "Avaliações de títulos de mangá")
public class RatingController {

    private final GetRatingsByTitleUseCase getRatingsByTitleUseCase;
    private final GetRatingAverageUseCase getRatingAverageUseCase;
    private final SubmitRatingUseCase submitRatingUseCase;
    private final DeleteRatingUseCase deleteRatingUseCase;
    private final GetUserRatingsUseCase getUserRatingsUseCase;

    @GetMapping("/title/{titleId}")
    @Operation(summary = "Listar avaliações", description = "Retorna todas as avaliações de um título")
    public ResponseEntity<ApiResponse<List<RatingResponse>>> getByTitle(@PathVariable String titleId) {
        var ratings = getRatingsByTitleUseCase.execute(titleId);
        return ResponseEntity.ok(ApiResponse.success(RatingMapper.toResponseList(ratings)));
    }

    @GetMapping("/title/{titleId}/average")
    @Operation(summary = "Média de avaliações", description = "Retorna a média de estrelas e contagem")
    public ResponseEntity<ApiResponse<RatingAverageResponse>> getAverage(@PathVariable String titleId) {
        var avg = getRatingAverageUseCase.execute(titleId);
        return ResponseEntity.ok(ApiResponse.success(new RatingAverageResponse(avg.average(), avg.count())));
    }

    @GetMapping("/user")
    @Operation(summary = "Minhas avaliações", description = "Retorna todas as avaliações do usuário logado")
    public ResponseEntity<ApiResponse<List<RatingResponse>>> getUserRatings(Authentication auth) {
        var ratings = getUserRatingsUseCase.execute(extractUserId(auth));
        return ResponseEntity.ok(ApiResponse.success(RatingMapper.toResponseList(ratings)));
    }

    @PostMapping
    @Operation(summary = "Avaliar título", description = "Submete ou atualiza uma avaliação para um título")
    public ResponseEntity<ApiResponse<RatingResponse>> submit(
            @Valid @RequestBody SubmitRatingRequest request,
            Authentication auth
    ) {
        var input = new SubmitRatingUseCase.SubmitRatingInput(
                request.titleId(),
                extractUserId(auth),
                request.stars(),
                request.comment(),
                request.categoryRatings()
        );
        var rating = submitRatingUseCase.execute(input);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(RatingMapper.toResponse(rating)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir avaliação", description = "Remove uma avaliação existente")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication auth) {
        deleteRatingUseCase.execute(id, extractUserId(auth));
        return ResponseEntity.noContent().build();
    }

    // ── Helper ──────────────────────────────────────────────────────────────

    private UUID extractUserId(Authentication auth) {
        return UUID.fromString((String) auth.getPrincipal());
    }
}
