package com.mangareader.presentation.review.controller;

import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.review.port.ReviewVoteRepositoryPort;
import com.mangareader.application.review.usecase.CastReviewVoteUseCase;
import com.mangareader.application.review.usecase.DeleteReviewUseCase;
import com.mangareader.application.review.usecase.GetReviewAverageUseCase;
import com.mangareader.application.review.usecase.GetReviewDistributionUseCase;
import com.mangareader.application.review.usecase.GetReviewsByTitleUseCase;
import com.mangareader.application.review.usecase.GetUserReviewsUseCase;
import com.mangareader.application.review.usecase.RemoveReviewVoteUseCase;
import com.mangareader.application.review.usecase.SubmitReviewUseCase;
import com.mangareader.application.review.usecase.UpdateReviewUseCase;
import com.mangareader.domain.review.entity.Review;
import com.mangareader.presentation.review.dto.ReviewAverageResponse;
import com.mangareader.presentation.review.dto.ReviewDistributionResponse;
import com.mangareader.presentation.review.dto.ReviewResponse;
import com.mangareader.presentation.review.dto.SubmitReviewRequest;
import com.mangareader.presentation.review.dto.UpdateReviewRequest;
import com.mangareader.presentation.review.mapper.ReviewMapper;
import com.mangareader.shared.domain.vote.VoteValue;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;
import com.mangareader.shared.dto.VoteRequest;
import com.mangareader.shared.dto.VoteResponse;
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
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Ratings", description = "Avaliações de títulos de mangá")
public class ReviewController {
    private final GetReviewsByTitleUseCase getRatingsByTitleUseCase;
    private final GetReviewAverageUseCase getRatingAverageUseCase;
    private final GetReviewDistributionUseCase getRatingDistributionUseCase;
    private final SubmitReviewUseCase submitRatingUseCase;
    private final UpdateReviewUseCase updateRatingUseCase;
    private final DeleteReviewUseCase deleteRatingUseCase;
    private final GetUserReviewsUseCase getUserRatingsUseCase;
    private final CastReviewVoteUseCase castReviewVoteUseCase;
    private final RemoveReviewVoteUseCase removeReviewVoteUseCase;
    private final ReviewVoteRepositoryPort reviewVoteRepository;

    @GetMapping("/title/{titleId}")
    @Operation(summary = "Listar avaliações", description = "Retorna avaliações de um título com paginação")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getByTitle(
            @PathVariable String titleId,
            @CurrentUserId UUID userId,
            @RequestParam(required = false) Integer star,
            @PageParams(defaultSort = "createdAt", defaultDirection = "desc",
                    allow = {"createdAt", "updatedAt", "overallRating", "upvotes"})
            Pageable pageable
    ) {
        var result = getRatingsByTitleUseCase.execute(titleId, star, pageable);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(toResponseWithMyVote(result, userId))));
    }

    @GetMapping("/title/{titleId}/average")
    @Operation(summary = "Média de avaliações", description = "Retorna a média de estrelas e contagem")
    public ResponseEntity<ApiResponse<ReviewAverageResponse>> getAverage(@PathVariable String titleId) {
        var avg = getRatingAverageUseCase.execute(titleId);

        return ResponseEntity.ok(ApiResponse.success(new ReviewAverageResponse(avg.average(), avg.count())));
    }

    @GetMapping("/title/{titleId}/distribution")
    @Operation(summary = "Distribuição de avaliações", description = "Contagem de avaliações por faixa de estrela (1–5)")
    public ResponseEntity<ApiResponse<ReviewDistributionResponse>> getDistribution(@PathVariable String titleId) {
        var distribution = getRatingDistributionUseCase.execute(titleId);

        return ResponseEntity.ok(ApiResponse.success(ReviewDistributionResponse.from(distribution)));
    }

    @GetMapping("/user")
    @Operation(summary = "Minhas avaliações", description = "Retorna avaliações do usuário logado com paginação")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getUserRatings(
            @CurrentUserId UUID userId,
            @PageParams(defaultSort = "createdAt", defaultDirection = "desc",
                    ignoreRequestSort = true)
            Pageable pageable
    ) {
        var result = getUserRatingsUseCase.execute(userId, pageable);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(toResponseWithMyVote(result, userId))));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Resenhas de um usuário", description = "Retorna as avaliações feitas por um usuário (perfil público), com paginação")
    public ResponseEntity<ApiResponse<PageResponse<ReviewResponse>>> getByUser(
            @PathVariable UUID userId,
            @PageParams(defaultSort = "createdAt", defaultDirection = "desc",
                    ignoreRequestSort = true)
            Pageable pageable
    ) {
        var result = getUserRatingsUseCase.execute(userId, pageable);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result.map(ReviewMapper::toResponse))));
    }

    /**
     * Mapeia uma página de avaliações para DTO, resolvendo {@code myVote} do
     * usuário autenticado em lote (uma query, sem N+1). Anônimo ({@code userId}
     * nulo) ⇒ {@code myVote} nulo.
     */
    private Page<ReviewResponse> toResponseWithMyVote(Page<Review> page, UUID userId) {
        if (userId == null || page.isEmpty()) {
            return page.map(ReviewMapper::toResponse);
        }

        Map<String, VoteValue> votesByRating = reviewVoteRepository
                .findByRatingIdInAndUserId(page.map(Review::getId).getContent(), userId.toString())
                .stream()
                .collect(Collectors.toMap(v -> v.getRatingId(), v -> v.getValue(), (a, b) -> a));

        return page.map(rating -> ReviewMapper.toResponse(rating, votesByRating.get(rating.getId())));
    }

    @PostMapping
    @Operation(summary = "Avaliar título", description = "Submete ou atualiza uma avaliação para um título")
    public ResponseEntity<ApiResponse<ReviewResponse>> submit(
            @Valid @RequestBody SubmitReviewRequest request,
            @CurrentUserId UUID userId
    ) {
        var input = new SubmitReviewUseCase.SubmitReviewInput(
                request.titleId(),
                userId,
                request.funRating(),
                request.artRating(),
                request.storylineRating(),
                request.charactersRating(),
                request.originalityRating(),
                request.pacingRating(),
                request.textContent(),
                request.reviewTitle(),
                request.spoiler()
        );

        var rating = submitRatingUseCase.execute(input);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(ReviewMapper.toResponse(rating)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar avaliação", description = "Atualiza uma avaliação existente do usuário logado")
    public ResponseEntity<ApiResponse<ReviewResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateReviewRequest request,
            @CurrentUserId UUID userId
    ) {
        var input = new UpdateReviewUseCase.UpdateReviewInput(
                id,
                userId,
                request.funRating(),
                request.artRating(),
                request.storylineRating(),
                request.charactersRating(),
                request.originalityRating(),
                request.pacingRating(),
                request.textContent(),
                request.reviewTitle(),
                request.spoiler()
        );

        var rating = updateRatingUseCase.execute(input);

        return ResponseEntity.ok(ApiResponse.success(ReviewMapper.toResponse(rating)));
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

    @PostMapping("/{id}/vote")
    @Operation(summary = "Votar em resenha", description = "Registra voto Útil/Contrário (toggle); 1 voto por usuário")
    public ResponseEntity<ApiResponse<VoteResponse>> vote(
            @PathVariable String id,
            @Valid @RequestBody VoteRequest request,
            @CurrentUserId UUID userId
    ) {
        var result = castReviewVoteUseCase.execute(id, userId, VoteValue.fromValue(request.value()));

        return ResponseEntity.ok(ApiResponse.success(VoteResponse.from(result)));
    }

    @DeleteMapping("/{id}/vote")
    @Operation(summary = "Remover voto de resenha", description = "Remove o voto do usuário na resenha")
    public ResponseEntity<ApiResponse<VoteResponse>> removeVote(
            @PathVariable String id,
            @CurrentUserId UUID userId
    ) {
        var result = removeReviewVoteUseCase.execute(id, userId);

        return ResponseEntity.ok(ApiResponse.success(VoteResponse.from(result)));
    }
}
