package com.mangareader.presentation.social.controller;

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

import com.mangareader.application.group.usecase.GetFollowedGroupsUseCase;
import com.mangareader.application.social.usecase.FollowUserUseCase;
import com.mangareader.application.social.usecase.GetFollowersUseCase;
import com.mangareader.application.social.usecase.GetFollowingUseCase;
import com.mangareader.application.social.usecase.UnfollowUserUseCase;
import com.mangareader.presentation.group.dto.GroupPreviewResponse;
import com.mangareader.presentation.group.mapper.GroupMapper;
import com.mangareader.presentation.social.dto.FollowStatusResponse;
import com.mangareader.presentation.social.dto.UserSummaryResponse;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;
import com.mangareader.shared.web.CurrentUserId;
import com.mangareader.shared.web.PageParams;

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
