package com.mangareader.presentation.group.controller;

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

import com.mangareader.application.group.usecase.AddWorkToGroupUseCase;
import com.mangareader.application.group.usecase.CreateGroupUseCase;
import com.mangareader.application.group.usecase.GetGroupByIdUseCase;
import com.mangareader.application.group.usecase.GetGroupByUsernameUseCase;
import com.mangareader.application.group.usecase.GetGroupsByTitleIdUseCase;
import com.mangareader.application.group.usecase.GetGroupsUseCase;
import com.mangareader.application.group.usecase.JoinGroupUseCase;
import com.mangareader.application.group.usecase.LeaveGroupUseCase;
import com.mangareader.application.group.usecase.RemoveWorkFromGroupUseCase;
import com.mangareader.application.group.usecase.SupportGroupUseCase;
import com.mangareader.application.group.usecase.UnsupportGroupUseCase;
import com.mangareader.application.group.usecase.UpdateGroupUseCase;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.presentation.group.dto.AddWorkRequest;
import com.mangareader.presentation.group.dto.CreateGroupRequest;
import com.mangareader.presentation.group.dto.GroupPreviewResponse;
import com.mangareader.presentation.group.dto.GroupResponse;
import com.mangareader.presentation.group.dto.UpdateGroupRequest;
import com.mangareader.presentation.group.mapper.GroupMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller de grupos de tradução.
 * <p>
 * GET é público; POST (criar/entrar) requer autenticação.
 */
@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@Tag(name = "Groups", description = "Grupos de tradução / scanlation")
public class GroupController {
    private final GetGroupsUseCase getGroupsUseCase;
    private final GetGroupByIdUseCase getGroupByIdUseCase;
    private final GetGroupByUsernameUseCase getGroupByUsernameUseCase;
    private final GetGroupsByTitleIdUseCase getGroupsByTitleIdUseCase;
    private final CreateGroupUseCase createGroupUseCase;
    private final UpdateGroupUseCase updateGroupUseCase;
    private final JoinGroupUseCase joinGroupUseCase;
    private final LeaveGroupUseCase leaveGroupUseCase;
    private final AddWorkToGroupUseCase addWorkToGroupUseCase;
    private final RemoveWorkFromGroupUseCase removeWorkFromGroupUseCase;
    private final SupportGroupUseCase supportGroupUseCase;
    private final UnsupportGroupUseCase unsupportGroupUseCase;

    @GetMapping
    @Operation(summary = "Listar grupos", description = "Retorna grupos de tradução com paginação")
    public ResponseEntity<ApiResponse<PageResponse<GroupResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "name") String sort,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        var pageable = buildPageable(page, size, sort, direction);

        var result = getGroupsUseCase.execute(pageable);

        var mapped = result.map(GroupMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar grupo por ID", description = "Retorna os detalhes de um grupo específico")
    public ResponseEntity<ApiResponse<GroupResponse>> getById(@PathVariable UUID id) {
        var group = getGroupByIdUseCase.execute(id);

        return ResponseEntity.ok(ApiResponse.success(GroupMapper.toResponse(group)));
    }

    @GetMapping("/username/{username}")
    @Operation(summary = "Buscar grupo por username", description = "Retorna um grupo pelo seu username (slug)")
    public ResponseEntity<ApiResponse<GroupResponse>> getByUsername(@PathVariable String username) {
        var group = getGroupByUsernameUseCase.execute(username);

        return ResponseEntity.ok(ApiResponse.success(GroupMapper.toResponse(group)));
    }

    @PostMapping
    @Operation(summary = "Criar grupo", description = "Cria um novo grupo. O criador se torna líder.")
    public ResponseEntity<ApiResponse<GroupResponse>> create(
            @Valid @RequestBody CreateGroupRequest request,
            Authentication auth
    ) {
        var input = new CreateGroupUseCase.CreateGroupInput(
                extractUserId(auth),
                request.name(),
                request.username(),
                request.description(),
                request.logo(),
                request.banner(),
                request.website(),
                request.foundedYear()
        );

        var group = createGroupUseCase.execute(input);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(GroupMapper.toResponse(group)));
    }

    @PostMapping("/{id}/join")
    @Operation(summary = "Entrar no grupo", description = "Adiciona o usuário logado como membro do grupo")
    public ResponseEntity<ApiResponse<GroupResponse>> join(
            @PathVariable UUID id,
            Authentication auth
    ) {
        var input = new JoinGroupUseCase.JoinGroupInput(id, extractUserId(auth), GroupRole.TRADUTOR);

        var group = joinGroupUseCase.execute(input);

        return ResponseEntity.ok(ApiResponse.success(GroupMapper.toResponse(group)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualizar grupo", description = "Atualiza informações do grupo (somente líder)")
    public ResponseEntity<ApiResponse<GroupResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateGroupRequest request,
            Authentication auth
    ) {
        var input = new UpdateGroupUseCase.UpdateGroupInput(
                id, extractUserId(auth),
                request.name(), request.description(),
                request.logo(), request.banner(), request.website()
        );

        var group = updateGroupUseCase.execute(input);

        return ResponseEntity.ok(ApiResponse.success(GroupMapper.toResponse(group)));
    }

    @DeleteMapping("/{id}/leave")
    @Operation(summary = "Sair do grupo", description = "Remove o usuário logado do grupo")
    public ResponseEntity<ApiResponse<GroupResponse>> leave(
            @PathVariable UUID id,
            Authentication auth
    ) {
        var group = leaveGroupUseCase.execute(id, extractUserId(auth));

        return ResponseEntity.ok(ApiResponse.success(GroupMapper.toResponse(group)));
    }

    @GetMapping("/title/{titleId}")
    @Operation(summary = "Grupos por título", description = "Retorna grupos que traduzem um título específico com paginação")
    public ResponseEntity<ApiResponse<PageResponse<GroupPreviewResponse>>> getByTitleId(
            @PathVariable String titleId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"));

        var result = getGroupsByTitleIdUseCase.execute(titleId, pageable);

        var mapped = result.map(GroupMapper::toPreviewResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @PostMapping("/{id}/works")
    @Operation(summary = "Adicionar obra", description = "Adiciona uma obra ao portfólio do grupo (membro)")
    public ResponseEntity<ApiResponse<GroupResponse>> addWork(
            @PathVariable UUID id,
            @Valid @RequestBody AddWorkRequest request,
            Authentication auth
    ) {
        var input = new AddWorkToGroupUseCase.AddWorkInput(
                id, extractUserId(auth),
                request.titleId(), request.title(), request.cover(),
                request.chapters(), request.status(), request.genres()
        );

        var group = addWorkToGroupUseCase.execute(input);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(GroupMapper.toResponse(group)));
    }

    @DeleteMapping("/{id}/works/{titleId}")
    @Operation(summary = "Remover obra", description = "Remove uma obra do portfólio do grupo (líder)")
    public ResponseEntity<Void> removeWork(
            @PathVariable UUID id,
            @PathVariable String titleId,
            Authentication auth
    ) {
        removeWorkFromGroupUseCase.execute(id, extractUserId(auth), titleId);

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/support")
    @Operation(summary = "Apoiar grupo", description = "Adiciona o usuário logado como apoiador do grupo")
    public ResponseEntity<ApiResponse<GroupResponse>> support(
            @PathVariable UUID id,
            Authentication auth
    ) {
        var group = supportGroupUseCase.execute(id, extractUserId(auth));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(GroupMapper.toResponse(group)));
    }

    @DeleteMapping("/{id}/support")
    @Operation(summary = "Deixar de apoiar grupo", description = "Remove o apoio do usuário logado ao grupo")
    public ResponseEntity<ApiResponse<GroupResponse>> unsupport(
            @PathVariable UUID id,
            Authentication auth
    ) {
        var group = unsupportGroupUseCase.execute(id, extractUserId(auth));

        return ResponseEntity.ok(ApiResponse.success(GroupMapper.toResponse(group)));
    }

    // TODO: Retirar essa lógica do controller
    private UUID extractUserId(Authentication auth) {
        return (UUID) auth.getPrincipal();
    }

    private Pageable buildPageable(int page, int size, String sort, String direction) {
        var dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;

        return PageRequest.of(page, size, Sort.by(dir, sort));
    }
}
