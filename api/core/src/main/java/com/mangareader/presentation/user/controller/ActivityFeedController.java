package com.mangareader.presentation.user.controller;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.user.usecase.GetUserActivityFeedUseCase;
import com.mangareader.application.user.usecase.HideActivityEventUseCase;
import com.mangareader.presentation.user.dto.ActivityEventResponse;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;
import com.mangareader.shared.web.CurrentUserId;
import com.mangareader.shared.web.PageParams;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Feed de atividades do perfil do usuário (leu capítulo, publicou resenha,
 * concluiu título, passou a seguir).
 */
@RestController
@RequiredArgsConstructor
@Tag(name = "Activity Feed", description = "Feed de atividades do perfil do usuário")
public class ActivityFeedController {
    private final GetUserActivityFeedUseCase getUserActivityFeedUseCase;
    private final HideActivityEventUseCase hideActivityEventUseCase;

    @GetMapping("/api/users/{userId}/activity-feed")
    @Operation(summary = "Feed de atividades de um usuário", description = "Paginado, mais recentes primeiro. Respeita viewHistoryVisibility para visitantes.")
    public ResponseEntity<ApiResponse<PageResponse<ActivityEventResponse>>> getActivityFeed(
            @PathVariable UUID userId,
            @PageParams(defaultSort = "occurredAt", defaultDirection = "desc")
            Pageable pageable,
            Authentication auth
    ) {
        UUID viewerUserId = auth != null ? (UUID) auth.getPrincipal() : null;

        var result = getUserActivityFeedUseCase.execute(userId, viewerUserId, pageable);
        var mapped = result.map(ActivityEventResponse::from);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @DeleteMapping("/api/users/me/activity-feed/{eventId}")
    @Operation(summary = "Ocultar evento do meu feed", description = "Remove o evento do próprio feed de atividades (soft-delete)")
    public ResponseEntity<Void> hide(
            @PathVariable String eventId,
            @CurrentUserId UUID userId
    ) {
        hideActivityEventUseCase.execute(userId, eventId);

        return ResponseEntity.noContent().build();
    }
}
