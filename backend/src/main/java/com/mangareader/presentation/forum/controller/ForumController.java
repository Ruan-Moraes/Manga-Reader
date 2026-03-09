package com.mangareader.presentation.forum.controller;

import java.util.Arrays;
import java.util.List;
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

import com.mangareader.application.forum.usecase.CreateForumReplyUseCase;
import com.mangareader.application.forum.usecase.CreateForumTopicUseCase;
import com.mangareader.application.forum.usecase.DeleteForumTopicUseCase;
import com.mangareader.application.forum.usecase.GetForumTopicByIdUseCase;
import com.mangareader.application.forum.usecase.GetForumTopicsByCategoryUseCase;
import com.mangareader.application.forum.usecase.GetForumTopicsUseCase;
import com.mangareader.application.forum.usecase.UpdateForumTopicUseCase;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.presentation.forum.dto.CreateReplyRequest;
import com.mangareader.presentation.forum.dto.CreateTopicRequest;
import com.mangareader.presentation.forum.dto.ForumCategoryResponse;
import com.mangareader.presentation.forum.dto.ForumTopicResponse;
import com.mangareader.presentation.forum.dto.UpdateTopicRequest;
import com.mangareader.presentation.forum.mapper.ForumMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller do fórum.
 * <p>
 * GET é público; POST (criar tópico/reply) requer autenticação.
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

    @GetMapping
    @Operation(summary = "Listar tópicos", description = "Retorna tópicos do fórum com paginação")
    public ResponseEntity<ApiResponse<PageResponse<ForumTopicResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        var pageable = buildPageable(page, size, sort, direction);

        var result = getForumTopicsUseCase.execute(pageable);

        var mapped = result.map(ForumMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar tópico por ID", description = "Retorna um tópico completo com replies")
    public ResponseEntity<ApiResponse<ForumTopicResponse>> getById(@PathVariable UUID id) {
        var topic = getForumTopicByIdUseCase.execute(id);

        return ResponseEntity.ok(ApiResponse.success(ForumMapper.toResponse(topic)));
    }

    @GetMapping("/category/{category}")
    @Operation(summary = "Filtrar tópicos por categoria")
    public ResponseEntity<ApiResponse<PageResponse<ForumTopicResponse>>> getByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        var cat = parseCategory(category);

        var pageable = buildPageable(page, size, "createdAt", "desc");

        var result = getForumTopicsByCategoryUseCase.execute(cat, pageable);

        var mapped = result.map(ForumMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @PostMapping
    @Operation(summary = "Criar tópico", description = "Cria um novo tópico no fórum (autenticado)")
    public ResponseEntity<ApiResponse<ForumTopicResponse>> create(
            @Valid @RequestBody CreateTopicRequest request,
            Authentication auth
    ) {
        var cat = parseCategory(request.category());

        var input = new CreateForumTopicUseCase.CreateTopicInput(
                extractUserId(auth),
                request.title(),
                request.content(),
                cat,
                request.tags()
        );

        var topic = createForumTopicUseCase.execute(input);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(ForumMapper.toResponse(topic)));
    }

    @PostMapping("/{id}/replies")
    @Operation(summary = "Responder tópico", description = "Cria uma resposta em um tópico (autenticado)")
    public ResponseEntity<ApiResponse<ForumTopicResponse>> reply(
            @PathVariable UUID id,
            @Valid @RequestBody CreateReplyRequest request,
            Authentication auth
    ) {
        var input = new CreateForumReplyUseCase.CreateReplyInput(id, extractUserId(auth), request.content());

        var topic = createForumReplyUseCase.execute(input);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(ForumMapper.toResponse(topic)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar tópico", description = "Atualiza um tópico existente (somente o autor)")
    public ResponseEntity<ApiResponse<ForumTopicResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTopicRequest request,
            Authentication auth
    ) {
        ForumCategory cat = request.category() != null ? parseCategory(request.category()) : null;

        var input = new UpdateForumTopicUseCase.UpdateTopicInput(
                id, extractUserId(auth),
                request.title(), request.content(), cat, request.tags()
        );

        var topic = updateForumTopicUseCase.execute(input);

        return ResponseEntity.ok(ApiResponse.success(ForumMapper.toResponse(topic)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remover tópico", description = "Remove um tópico do fórum (somente o autor)")
    public ResponseEntity<Void> delete(@PathVariable UUID id, Authentication auth) {
        deleteForumTopicUseCase.execute(id, extractUserId(auth));

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/categories")
    @Operation(summary = "Listar categorias", description = "Retorna todas as categorias disponíveis do fórum")
    public ResponseEntity<ApiResponse<List<ForumCategoryResponse>>> getCategories() {
        var categories = Arrays.stream(ForumCategory.values())
                .map(c -> new ForumCategoryResponse(c.name(), c.getDisplayName()))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    // TODO: Retirar essa lógica do controller
    private Pageable buildPageable(int page, int size, String sort, String direction) {
        var dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;

        return PageRequest.of(page, size, Sort.by(dir, sort));
    }

    private ForumCategory parseCategory(String value) {
        for (ForumCategory cat : ForumCategory.values()) {
            if (cat.getDisplayName().equalsIgnoreCase(value) || cat.name().equalsIgnoreCase(value)) {
                return cat;
            }
        }

        throw new IllegalArgumentException("Categoria de fórum inválida: " + value);
    }

    private UUID extractUserId(Authentication auth) {
        return (UUID) auth.getPrincipal();
    }
}
