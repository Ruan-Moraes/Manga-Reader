package com.mangareader.presentation.rating.controller;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.mangareader.shared.web.CurrentUserId;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.rating.usecase.DeleteRatingUseCase;
import com.mangareader.application.rating.usecase.GetRatingAverageUseCase;
import com.mangareader.application.rating.usecase.GetRatingsByTitleUseCase;
import com.mangareader.application.rating.usecase.GetUserRatingsUseCase;
import com.mangareader.application.rating.usecase.SubmitRatingUseCase;
import com.mangareader.application.rating.usecase.UpdateRatingUseCase;
import com.mangareader.presentation.rating.dto.RatingAverageResponse;
import com.mangareader.presentation.rating.dto.RatingResponse;
import com.mangareader.presentation.rating.dto.SubmitRatingRequest;
import com.mangareader.presentation.rating.dto.UpdateRatingRequest;
import com.mangareader.presentation.rating.mapper.RatingMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;
import com.mangareader.shared.web.PageParams;

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
    private final UpdateRatingUseCase updateRatingUseCase;
    private final DeleteRatingUseCase deleteRatingUseCase;
    private final GetUserRatingsUseCase getUserRatingsUseCase;

    @GetMapping("/title/{titleId}")
    @Operation(summary = "Listar avaliações", description = "Retorna avaliações de um título com paginação")
    public ResponseEntity<ApiResponse<PageResponse<RatingResponse>>> getByTitle(
            @PathVariable String titleId,
            @PageParams(defaultSort = "createdAt", defaultDirection = "desc",
                    allow = {"createdAt", "updatedAt", "overallRating"})
            Pageable pageable
    ) {
        var result = getRatingsByTitleUseCase.execute(titleId, pageable);

        var mapped = result.map(RatingMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/title/{titleId}/average")
    @Operation(summary = "Média de avaliações", description = "Retorna a média de estrelas e contagem")
    public ResponseEntity<ApiResponse<RatingAverageResponse>> getAverage(@PathVariable String titleId) {
        var avg = getRatingAverageUseCase.execute(titleId);

        return ResponseEntity.ok(ApiResponse.success(new RatingAverageResponse(avg.average(), avg.count())));
    }

    @GetMapping("/user")
    @Operation(summary = "Minhas avaliações", description = "Retorna avaliações do usuário logado com paginação")
    public ResponseEntity<ApiResponse<PageResponse<RatingResponse>>> getUserRatings(
            @CurrentUserId UUID userId,
            @PageParams(defaultSort = "createdAt", defaultDirection = "desc",
                    ignoreRequestSort = true)
            Pageable pageable
    ) {
        var result = getUserRatingsUseCase.execute(userId, pageable);

        var mapped = result.map(RatingMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @PostMapping
    @Operation(summary = "Avaliar título", description = "Submete ou atualiza uma avaliação para um título")
    public ResponseEntity<ApiResponse<RatingResponse>> submit(
            @Valid @RequestBody SubmitRatingRequest request,
            @CurrentUserId UUID userId
    ) {
        var input = new SubmitRatingUseCase.SubmitRatingInput(
                request.titleId(),
                userId,
                request.funRating(),
                request.artRating(),
                request.storylineRating(),
                request.charactersRating(),
                request.originalityRating(),
                request.pacingRating(),
                request.comment()
        );

        var rating = submitRatingUseCase.execute(input);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(RatingMapper.toResponse(rating)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar avaliação", description = "Atualiza uma avaliação existente do usuário logado")
    public ResponseEntity<ApiResponse<RatingResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateRatingRequest request,
            @CurrentUserId UUID userId
    ) {
        var input = new UpdateRatingUseCase.UpdateRatingInput(
                id,
                userId,
                request.funRating(),
                request.artRating(),
                request.storylineRating(),
                request.charactersRating(),
                request.originalityRating(),
                request.pacingRating(),
                request.comment()
        );

        var rating = updateRatingUseCase.execute(input);

        return ResponseEntity.ok(ApiResponse.success(RatingMapper.toResponse(rating)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir avaliação", description = "Remove uma avaliação existente")
    public ResponseEntity<Void> delete(
            @PathVariable String id,
            @CurrentUserId UUID userId
    ) {
        deleteRatingUseCase.execute(id, userId);
        return ResponseEntity.noContent().build();
    }
}
