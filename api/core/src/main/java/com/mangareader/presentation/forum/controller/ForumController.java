package com.mangareader.presentation.forum.controller;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

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

import com.mangareader.application.forum.usecase.CastForumTopicVoteUseCase;
import com.mangareader.application.forum.usecase.CreateForumReplyUseCase;
import com.mangareader.application.forum.usecase.CreateForumTopicUseCase;
import com.mangareader.application.forum.usecase.DeleteForumTopicUseCase;
import com.mangareader.application.forum.usecase.GetForumTopicByIdUseCase;
import com.mangareader.application.forum.usecase.GetForumTopicsByCategoryUseCase;
import com.mangareader.application.forum.usecase.GetForumTopicsUseCase;
import com.mangareader.application.forum.usecase.RemoveForumTopicVoteUseCase;
import com.mangareader.application.forum.usecase.UpdateForumTopicUseCase;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.presentation.forum.dto.CreateReplyRequest;
import com.mangareader.presentation.forum.dto.CreateTopicRequest;
import com.mangareader.presentation.forum.dto.ForumCategoryResponse;
import com.mangareader.presentation.forum.dto.ForumTopicResponse;
import com.mangareader.presentation.forum.dto.ForumTopicSummaryResponse;
import com.mangareader.presentation.forum.dto.UpdateTopicRequest;
import com.mangareader.presentation.forum.mapper.ForumMapper;
import com.mangareader.shared.domain.vote.VoteValue;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;
import com.mangareader.shared.dto.VoteRequest;
import com.mangareader.shared.dto.VoteResponse;
import com.mangareader.shared.web.CurrentUserId;
import com.mangareader.shared.web.PageParams;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller do fórum (tópicos no MongoDB; respostas são comentários
 * unificados — votos por resposta usam {@code /api/comments}).
 * <p>
 * GET é público; POST/PUT/DELETE/voto requerem autenticação.
 */
@RestController
@RequestMapping("/api/forum")
@RequiredArgsConstructor
@Tag(name = "Forum", description = "Fórum da comunidade")
public class ForumController {
    private final GetForumTopicsUseCase getForumTopicsUseCase;
    private final GetForumTopicByIdUseCase getForumTopicByIdUseCase;
    private final GetForumTopicsByCategoryUseCase getForumTopicsByCategoryUseCase;
    private final CreateForumTopicUseCase createForumTopicUseCase;
    private final CreateForumReplyUseCase createForumReplyUseCase;
    private final UpdateForumTopicUseCase updateForumTopicUseCase;
    private final DeleteForumTopicUseCase deleteForumTopicUseCase;
    private final CastForumTopicVoteUseCase castForumTopicVoteUseCase;
    private final RemoveForumTopicVoteUseCase removeForumTopicVoteUseCase;
    private final ForumMapper forumMapper;

    @GetMapping
    @Operation(summary = "Listar tópicos", description = "Retorna tópicos do fórum com paginação. Use language=all (admin) para listar todos idiomas.")
    public ResponseEntity<ApiResponse<PageResponse<ForumTopicSummaryResponse>>> getAll(
            @PageParams(defaultSize = 10, defaultSort = "createdAt",
                    defaultDirection = "desc",
                    allow = {"createdAt", "updatedAt", "title"})
            Pageable pageable,
            @RequestParam(required = false) String language,
            @CurrentUserId UUID userId
    ) {
        var result = getForumTopicsUseCase.execute(pageable, "all".equalsIgnoreCase(language));

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(forumMapper.toSummaryPage(result, userId))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar tópico por ID", description = "Retorna um tópico completo com replies (comentários unificados)")
    public ResponseEntity<ApiResponse<ForumTopicResponse>> getById(
            @PathVariable String id,
            @CurrentUserId UUID userId
    ) {
        var detail = getForumTopicByIdUseCase.execute(id);

        return ResponseEntity.ok(ApiResponse.success(forumMapper.toResponse(detail, userId)));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Filtrar tópicos por categoria", description = "language=all (admin) lista todos idiomas.")
    public ResponseEntity<ApiResponse<PageResponse<ForumTopicSummaryResponse>>> getByCategory(
            @PathVariable String category,
            @PageParams(defaultSize = 10, defaultSort = "createdAt",
                    defaultDirection = "desc", ignoreRequestSort = true)
            Pageable pageable,
            @RequestParam(required = false) String language,
            @CurrentUserId UUID userId
    ) {
        var cat = ForumCategory.fromValue(category);

        var result = getForumTopicsByCategoryUseCase.execute(cat, pageable, "all".equalsIgnoreCase(language));

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(forumMapper.toSummaryPage(result, userId))));
    }

    @PostMapping
    @Operation(summary = "Criar tópico", description = "Cria um novo tópico no fórum (autenticado)")
    public ResponseEntity<ApiResponse<ForumTopicResponse>> create(
            @Valid @RequestBody CreateTopicRequest request,
            @CurrentUserId UUID userId
    ) {
        var cat = ForumCategory.fromValue(request.category());

        var input = new CreateForumTopicUseCase.CreateTopicInput(
                userId,
                request.title(),
                request.content(),
                cat,
                request.tags()
        );

        var topic = createForumTopicUseCase.execute(input);
        var detail = getForumTopicByIdUseCase.execute(topic.getId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(forumMapper.toResponse(detail, userId)));
    }

    @PostMapping("/{id}/replies")
    @Operation(summary = "Responder tópico", description = "Cria uma resposta (comentário unificado) em um tópico (autenticado)")
    public ResponseEntity<ApiResponse<ForumTopicResponse>> reply(
            @PathVariable String id,
            @Valid @RequestBody CreateReplyRequest request,
            @CurrentUserId UUID userId
    ) {
        var input = new CreateForumReplyUseCase.CreateReplyInput(id, userId, request.content());

        createForumReplyUseCase.execute(input);
        var detail = getForumTopicByIdUseCase.execute(id);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(forumMapper.toResponse(detail, userId)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar tópico", description = "Atualiza um tópico existente (somente o autor)")
    public ResponseEntity<ApiResponse<ForumTopicResponse>> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateTopicRequest request,
            @CurrentUserId UUID userId
    ) {
        ForumCategory cat = request.category() != null ? ForumCategory.fromValue(request.category()) : null;

        var input = new UpdateForumTopicUseCase.UpdateTopicInput(
                id, userId,
                request.title(), request.content(), cat, request.tags()
        );

        updateForumTopicUseCase.execute(input);
        var detail = getForumTopicByIdUseCase.execute(id);

        return ResponseEntity.ok(ApiResponse.success(forumMapper.toResponse(detail, userId)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remover tópico", description = "Remove um tópico do fórum com replies e votos (somente o autor)")
    public ResponseEntity<Void> delete(
            @PathVariable String id,
            @CurrentUserId UUID userId
    ) {
        deleteForumTopicUseCase.execute(id, userId);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/vote")
    @Operation(summary = "Votar em tópico", description = "Registra voto up/down (toggle) no tópico; 1 voto por usuário")
    public ResponseEntity<ApiResponse<VoteResponse>> vote(
            @PathVariable String id,
            @Valid @RequestBody VoteRequest request,
            @CurrentUserId UUID userId
    ) {
        var result = castForumTopicVoteUseCase.execute(id, userId.toString(), VoteValue.fromValue(request.value()));

        return ResponseEntity.ok(ApiResponse.success(VoteResponse.from(result)));
    }

    @DeleteMapping("/{id}/vote")
    @Operation(summary = "Remover voto do tópico", description = "Remove o voto do usuário no tópico (idempotente)")
    public ResponseEntity<ApiResponse<VoteResponse>> removeVote(
            @PathVariable String id,
            @CurrentUserId UUID userId
    ) {
        var result = removeForumTopicVoteUseCase.execute(id, userId.toString());

        return ResponseEntity.ok(ApiResponse.success(VoteResponse.from(result)));
    }

    @GetMapping("/categories")
    @Operation(summary = "Listar categorias", description = "Retorna todas as categorias disponíveis do fórum")
    public ResponseEntity<ApiResponse<List<ForumCategoryResponse>>> getCategories() {
        var categories = Arrays.stream(ForumCategory.values())
                .map(c -> new ForumCategoryResponse(c.name(), c.getDisplayName()))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(categories));
    }
}
