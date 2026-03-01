package com.mangareader.presentation.group.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.group.usecase.CreateGroupUseCase;
import com.mangareader.application.group.usecase.GetGroupByIdUseCase;
import com.mangareader.application.group.usecase.GetGroupByUsernameUseCase;
import com.mangareader.application.group.usecase.GetGroupsUseCase;
import com.mangareader.application.group.usecase.JoinGroupUseCase;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.presentation.group.dto.CreateGroupRequest;
import com.mangareader.presentation.group.dto.GroupResponse;
import com.mangareader.presentation.group.mapper.GroupMapper;
import com.mangareader.shared.dto.ApiResponse;

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
    private final CreateGroupUseCase createGroupUseCase;
    private final JoinGroupUseCase joinGroupUseCase;

    @GetMapping
    @Operation(summary = "Listar grupos", description = "Retorna todos os grupos de tradução")
    public ResponseEntity<ApiResponse<List<GroupResponse>>> getAll() {
        var groups = getGroupsUseCase.execute();
        return ResponseEntity.ok(ApiResponse.success(GroupMapper.toResponseList(groups)));
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

    // ── Helper ──────────────────────────────────────────────────────────────

    private UUID extractUserId(Authentication auth) {
        return UUID.fromString((String) auth.getPrincipal());
    }
}
