package com.toonlira.presentation.social.controller;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import com.toonlira.application.group.usecase.GetFollowedGroupsUseCase;
import com.toonlira.application.social.usecase.FollowUserUseCase;
import com.toonlira.application.social.usecase.GetFollowersUseCase;
import com.toonlira.application.social.usecase.GetFollowingUseCase;
import com.toonlira.application.social.usecase.UnfollowUserUseCase;
import com.toonlira.presentation.group.dto.GroupPreviewResponse;
import com.toonlira.presentation.group.mapper.GroupMapper;
import com.toonlira.presentation.social.dto.FollowStatusResponse;
import com.toonlira.presentation.social.dto.UserSummaryResponse;
import com.toonlira.shared.dto.ApiResponse;
import com.toonlira.shared.dto.PageResponse;
import com.toonlira.shared.web.CurrentUserId;
import com.toonlira.shared.web.PageParams;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Grafo social — seguir/deixar de seguir e listas (DT-48).
 * <p>
 * Listas são públicas (coerente com {@code GET /api/users/{id}/profile});
 * follow/unfollow exigem autenticação. A ordenação das listas é fixa no grafo
 * (follow mais recente primeiro) — sort de request é ignorado.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Social", description = "Grafo social — seguidores e seguindo")
public class FollowController {
    private final FollowUserUseCase followUserUseCase;
    private final UnfollowUserUseCase unfollowUserUseCase;
    private final GetFollowersUseCase getFollowersUseCase;
    private final GetFollowingUseCase getFollowingUseCase;
    private final GetFollowedGroupsUseCase getFollowedGroupsUseCase;
    private final GroupMapper groupMapper;

    @PostMapping("/{id}/follow")
    @Operation(summary = "Seguir usuário", description = "Idempotente; não é possível seguir a si mesmo (409)")
    public ResponseEntity<ApiResponse<FollowStatusResponse>> follow(
            @PathVariable UUID id,
            @CurrentUserId UUID userId
    ) {
        var social = followUserUseCase.execute(userId, id);

        return ResponseEntity.ok(ApiResponse.success(FollowStatusResponse.from(social)));
    }

    @DeleteMapping("/{id}/follow")
    @Operation(summary = "Deixar de seguir", description = "Idempotente")
    public ResponseEntity<ApiResponse<FollowStatusResponse>> unfollow(
            @PathVariable UUID id,
            @CurrentUserId UUID userId
    ) {
        var social = unfollowUserUseCase.execute(userId, id);

        return ResponseEntity.ok(ApiResponse.success(FollowStatusResponse.from(social)));
    }

    @GetMapping("/{id}/followers")
    @Operation(summary = "Seguidores", description = "Quem segue o usuário, follow mais recente primeiro")
    public ResponseEntity<ApiResponse<PageResponse<UserSummaryResponse>>> followers(
            @PathVariable UUID id,
            @PageParams(ignoreRequestSort = true) Pageable pageable
    ) {
        var page = getFollowersUseCase.execute(id, pageable).map(UserSummaryResponse::from);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @GetMapping("/{id}/following")
    @Operation(summary = "Seguindo", description = "Quem o usuário segue, follow mais recente primeiro")
    public ResponseEntity<ApiResponse<PageResponse<UserSummaryResponse>>> following(
            @PathVariable UUID id,
            @PageParams(ignoreRequestSort = true) Pageable pageable
    ) {
        var page = getFollowingUseCase.execute(id, pageable).map(UserSummaryResponse::from);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(page)));
    }

    @GetMapping("/{id}/followed-groups")
    @Operation(summary = "Grupos seguidos", description = "Grupos que o usuário segue/apoia (SUPPORTER)")
    public ResponseEntity<ApiResponse<List<GroupPreviewResponse>>> followedGroups(@PathVariable UUID id) {
        var groups = getFollowedGroupsUseCase.execute(id).stream()
                .map(groupMapper::toPreviewResponse)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(groups));
    }
}
