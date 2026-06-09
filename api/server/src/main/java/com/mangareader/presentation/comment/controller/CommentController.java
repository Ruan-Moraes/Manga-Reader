package com.mangareader.presentation.comment.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.comment.usecase.CastCommentVoteUseCase;
import com.mangareader.application.comment.usecase.CreateCommentUseCase;
import com.mangareader.application.comment.usecase.DeleteCommentUseCase;
import com.mangareader.application.comment.usecase.GetCommentsByTargetUseCase;
import com.mangareader.application.comment.usecase.GetUserCommentVotesUseCase;
import com.mangareader.application.comment.usecase.RemoveCommentVoteUseCase;
import com.mangareader.application.comment.usecase.UpdateCommentUseCase;
import com.mangareader.domain.comment.valueobject.CommentTarget;
import com.mangareader.presentation.comment.dto.CommentResponse;
import com.mangareader.presentation.comment.dto.CreateCommentRequest;
import com.mangareader.presentation.comment.dto.UpdateCommentRequest;
import com.mangareader.presentation.comment.mapper.CommentMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;
import com.mangareader.shared.dto.VoteRequest;
import com.mangareader.shared.dto.VoteResponse;
import com.mangareader.shared.domain.vote.VoteValue;
import com.mangareader.shared.web.CurrentUserId;
import com.mangareader.shared.web.PageParams;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller de comentários unificados (obra, resenha, tópico de fórum).
 * <p>
 * GET é público; POST/PUT/DELETE/voto requerem autenticação.
 */
@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@Tag(name = "Comments", description = "Comentários unificados (obra, resenha, fórum)")
public class CommentController {

    private final GetCommentsByTargetUseCase getCommentsByTargetUseCase;
    private final CreateCommentUseCase createCommentUseCase;
    private final UpdateCommentUseCase updateCommentUseCase;
    private final DeleteCommentUseCase deleteCommentUseCase;
    private final CastCommentVoteUseCase castCommentVoteUseCase;
    private final RemoveCommentVoteUseCase removeCommentVoteUseCase;
    private final GetUserCommentVotesUseCase getUserCommentVotesUseCase;

    @GetMapping("/target/{targetType}/{targetId}")
    @Operation(summary = "Listar comentários por alvo",
            description = "Comentários de um alvo (TITLE/REVIEW/FORUM_TOPIC) com paginação. language=all lista todos idiomas.")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> getByTarget(
            @PathVariable String targetType,
            @PathVariable String targetId,
            @PageParams(defaultSort = "createdAt", defaultDirection = "desc",
                    allow = {"createdAt", "updatedAt"})
            Pageable pageable,
            @RequestParam(required = false) String language
    ) {
        var result = getCommentsByTargetUseCase.execute(
                CommentTarget.fromValue(targetType), targetId, pageable, "all".equalsIgnoreCase(language));
        var mapped = result.map(CommentMapper::toResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/title/{titleId}")
    @Operation(summary = "Listar comentários de um título",
            description = "Atalho para targetType=TITLE. Mantido para compatibilidade.")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> getByTitle(
            @PathVariable String titleId,
            @PageParams(defaultSort = "createdAt", defaultDirection = "desc",
                    allow = {"createdAt", "updatedAt"})
            Pageable pageable,
            @RequestParam(required = false) String language
    ) {
        var result = getCommentsByTargetUseCase.execute(
                CommentTarget.TITLE, titleId, pageable, "all".equalsIgnoreCase(language));
        var mapped = result.map(CommentMapper::toResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @PostMapping
    @Operation(summary = "Criar comentário", description = "Cria um comentário (root ou resposta) em qualquer alvo")
    public ResponseEntity<ApiResponse<CommentResponse>> create(
            @Valid @RequestBody CreateCommentRequest request,
            @CurrentUserId UUID userId
    ) {
        var input = new CreateCommentUseCase.CreateCommentInput(
                CommentTarget.fromValue(request.targetType()),
                request.targetId(),
                request.textContent(),
                request.imageContent(),
                request.parentCommentId(),
                userId
        );
        var comment = createCommentUseCase.execute(input);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(CommentMapper.toResponse(comment)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Editar comentário", description = "Atualiza o texto de um comentário existente")
    public ResponseEntity<ApiResponse<CommentResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateCommentRequest request,
            @CurrentUserId UUID userId
    ) {
        var input = new UpdateCommentUseCase.UpdateCommentInput(id, request.textContent(), userId);
        var comment = updateCommentUseCase.execute(input);
        return ResponseEntity.ok(ApiResponse.success(CommentMapper.toResponse(comment)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir comentário", description = "Remove um comentário existente")
    public ResponseEntity<Void> delete(
            @PathVariable String id,
            @CurrentUserId UUID userId
    ) {
        deleteCommentUseCase.execute(id, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/vote")
    @Operation(summary = "Votar em comentário", description = "Registra voto up/down (toggle) no comentário")
    public ResponseEntity<ApiResponse<VoteResponse>> vote(
            @PathVariable String id,
            @Valid @RequestBody VoteRequest request,
            @CurrentUserId UUID userId
    ) {
        var result = castCommentVoteUseCase.execute(id, userId.toString(), VoteValue.fromValue(request.value()));
        return ResponseEntity.ok(ApiResponse.success(VoteResponse.from(result)));
    }

    @DeleteMapping("/{id}/vote")
    @Operation(summary = "Remover voto", description = "Remove o voto do usuário no comentário (idempotente)")
    public ResponseEntity<ApiResponse<VoteResponse>> removeVote(
            @PathVariable String id,
            @CurrentUserId UUID userId
    ) {
        var result = removeCommentVoteUseCase.execute(id, userId.toString());
        return ResponseEntity.ok(ApiResponse.success(VoteResponse.from(result)));
    }

    @GetMapping("/user-votes")
    @Operation(summary = "Votos do usuário", description = "Retorna os votos do usuário para uma lista de comentários")
    public ResponseEntity<ApiResponse<Map<String, String>>> getUserVotes(
            @RequestParam List<String> commentIds,
            @CurrentUserId UUID userId
    ) {
        var votes = getUserCommentVotesUseCase.execute(commentIds, userId.toString());
        var mapped = votes.entrySet().stream()
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        e -> e.getValue().name().toLowerCase()
                ));
        return ResponseEntity.ok(ApiResponse.success(mapped));
    }
}
