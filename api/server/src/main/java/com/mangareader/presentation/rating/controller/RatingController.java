package com.mangareader.presentation.rating.controller;

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

import com.mangareader.application.rating.port.ReviewVoteRepositoryPort;
import com.mangareader.application.rating.usecase.CastReviewVoteUseCase;
import com.mangareader.application.rating.usecase.DeleteRatingUseCase;
import com.mangareader.application.rating.usecase.GetRatingAverageUseCase;
import com.mangareader.application.rating.usecase.GetRatingDistributionUseCase;
import com.mangareader.application.rating.usecase.GetRatingsByTitleUseCase;
import com.mangareader.application.rating.usecase.GetUserRatingsUseCase;
import com.mangareader.application.rating.usecase.RemoveReviewVoteUseCase;
import com.mangareader.application.rating.usecase.SubmitRatingUseCase;
import com.mangareader.application.rating.usecase.UpdateRatingUseCase;
import com.mangareader.domain.rating.entity.MangaRating;
import com.mangareader.presentation.rating.dto.RatingAverageResponse;
import com.mangareader.presentation.rating.dto.RatingDistributionResponse;
import com.mangareader.presentation.rating.dto.RatingResponse;
import com.mangareader.presentation.rating.dto.SubmitRatingRequest;
import com.mangareader.presentation.rating.dto.UpdateRatingRequest;
import com.mangareader.presentation.rating.mapper.RatingMapper;
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
@RequestMapping("/api/ratings")
@RequiredArgsConstructor
@Tag(name = "Ratings", description = "Avaliações de títulos de mangá")
public class RatingController {
    private final GetRatingsByTitleUseCase getRatingsByTitleUseCase;
    private final GetRatingAverageUseCase getRatingAverageUseCase;
    private final GetRatingDistributionUseCase getRatingDistributionUseCase;
    private final SubmitRatingUseCase submitRatingUseCase;
    private final UpdateRatingUseCase updateRatingUseCase;
    private final DeleteRatingUseCase deleteRatingUseCase;
    private final GetUserRatingsUseCase getUserRatingsUseCase;
    private final CastReviewVoteUseCase castReviewVoteUseCase;
    private final RemoveReviewVoteUseCase removeReviewVoteUseCase;
    private final ReviewVoteRepositoryPort reviewVoteRepository;

    @GetMapping("/title/{titleId}")
    @Operation(summary = "Listar avaliações", description = "Retorna avaliações de um título com paginação")
    public ResponseEntity<ApiResponse<PageResponse<RatingResponse>>> getByTitle(
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
    public ResponseEntity<ApiResponse<RatingAverageResponse>> getAverage(@PathVariable String titleId) {
        var avg = getRatingAverageUseCase.execute(titleId);

        return ResponseEntity.ok(ApiResponse.success(new RatingAverageResponse(avg.average(), avg.count())));
    }

    @GetMapping("/title/{titleId}/distribution")
    @Operation(summary = "Distribuição de avaliações", description = "Contagem de avaliações por faixa de estrela (1–5)")
    public ResponseEntity<ApiResponse<RatingDistributionResponse>> getDistribution(@PathVariable String titleId) {
        var distribution = getRatingDistributionUseCase.execute(titleId);

        return ResponseEntity.ok(ApiResponse.success(RatingDistributionResponse.from(distribution)));
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

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(toResponseWithMyVote(result, userId))));
    }

    @GetMapping("/user/{userId}")
    @Operation(summary = "Resenhas de um usuário", description = "Retorna as avaliações feitas por um usuário (perfil público), com paginação")
    public ResponseEntity<ApiResponse<PageResponse<RatingResponse>>> getByUser(
            @PathVariable UUID userId,
            @PageParams(defaultSort = "createdAt", defaultDirection = "desc",
                    ignoreRequestSort = true)
            Pageable pageable
    ) {
        var result = getUserRatingsUseCase.execute(userId, pageable);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result.map(RatingMapper::toResponse))));
    }

    /**
     * Mapeia uma página de avaliações para DTO, resolvendo {@code myVote} do
     * usuário autenticado em lote (uma query, sem N+1). Anônimo ({@code userId}
     * nulo) ⇒ {@code myVote} nulo.
     */
    private Page<RatingResponse> toResponseWithMyVote(Page<MangaRating> page, UUID userId) {
        if (userId == null || page.isEmpty()) {
            return page.map(RatingMapper::toResponse);
        }

        Map<String, VoteValue> votesByRating = reviewVoteRepository
                .findByRatingIdInAndUserId(page.map(MangaRating::getId).getContent(), userId.toString())
                .stream()
                .collect(Collectors.toMap(v -> v.getRatingId(), v -> v.getValue(), (a, b) -> a));

        return page.map(rating -> RatingMapper.toResponse(rating, votesByRating.get(rating.getId())));
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
                request.textContent(),
                request.reviewTitle(),
                request.spoiler()
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
                request.textContent(),
                request.reviewTitle(),
                request.spoiler()
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
