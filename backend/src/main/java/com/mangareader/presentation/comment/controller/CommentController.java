package com.mangareader.presentation.comment.controller;

import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.comment.usecase.CreateCommentUseCase;
import com.mangareader.application.comment.usecase.DeleteCommentUseCase;
import com.mangareader.application.comment.usecase.GetCommentsByTitleUseCase;
import com.mangareader.application.comment.usecase.ReactToCommentUseCase;
import com.mangareader.application.comment.usecase.UpdateCommentUseCase;
import com.mangareader.presentation.comment.dto.CommentResponse;
import com.mangareader.presentation.comment.dto.CreateCommentRequest;
import com.mangareader.presentation.comment.dto.UpdateCommentRequest;
import com.mangareader.presentation.comment.mapper.CommentMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller de comentários.
 * <p>
 * GET é público (listar por título); POST/PUT/DELETE requerem autenticação.
 */
@RestController
@RequestMapping("/api/comments")
@RequiredArgsConstructor
@Tag(name = "Comments", description = "Comentários em títulos")
public class CommentController {

    private final GetCommentsByTitleUseCase getCommentsByTitleUseCase;
    private final CreateCommentUseCase createCommentUseCase;
    private final UpdateCommentUseCase updateCommentUseCase;
    private final DeleteCommentUseCase deleteCommentUseCase;
    private final ReactToCommentUseCase reactToCommentUseCase;

    @GetMapping("/title/{titleId}")
    @Operation(summary = "Listar comentários", description = "Retorna comentários de um título com paginação")
    public ResponseEntity<ApiResponse<PageResponse<CommentResponse>>> getByTitle(
            @PathVariable String titleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        var pageable = buildPageable(page, size, sort, direction);
        var result = getCommentsByTitleUseCase.execute(titleId, pageable);
        var mapped = result.map(CommentMapper::toResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @PostMapping
    @Operation(summary = "Criar comentário", description = "Cria um novo comentário em um título")
    public ResponseEntity<ApiResponse<CommentResponse>> create(
            @Valid @RequestBody CreateCommentRequest request,
            Authentication auth
    ) {
        var input = new CreateCommentUseCase.CreateCommentInput(
                request.titleId(),
                request.textContent(),
                request.imageContent(),
                request.parentCommentId(),
                extractUserId(auth)
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
            Authentication auth
    ) {
        var input = new UpdateCommentUseCase.UpdateCommentInput(id, request.textContent(), extractUserId(auth));
        var comment = updateCommentUseCase.execute(input);
        return ResponseEntity.ok(ApiResponse.success(CommentMapper.toResponse(comment)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Excluir comentário", description = "Remove um comentário existente")
    public ResponseEntity<Void> delete(@PathVariable String id, Authentication auth) {
        deleteCommentUseCase.execute(id, extractUserId(auth));
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/like")
    @Operation(summary = "Curtir comentário", description = "Incrementa o contador de likes")
    public ResponseEntity<ApiResponse<CommentResponse>> like(@PathVariable String id) {
        var comment = reactToCommentUseCase.execute(id, ReactToCommentUseCase.ReactionType.LIKE);
        return ResponseEntity.ok(ApiResponse.success(CommentMapper.toResponse(comment)));
    }

    @PostMapping("/{id}/dislike")
    @Operation(summary = "Descurtir comentário", description = "Incrementa o contador de dislikes")
    public ResponseEntity<ApiResponse<CommentResponse>> dislike(@PathVariable String id) {
        var comment = reactToCommentUseCase.execute(id, ReactToCommentUseCase.ReactionType.DISLIKE);
        return ResponseEntity.ok(ApiResponse.success(CommentMapper.toResponse(comment)));
    }

    // ── Helper ──────────────────────────────────────────────────────────────

    private UUID extractUserId(Authentication auth) {
        return (UUID) auth.getPrincipal();
    }

    private Pageable buildPageable(int page, int size, String sort, String direction) {
        var dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return PageRequest.of(page, size, Sort.by(dir, sort));
    }
}
