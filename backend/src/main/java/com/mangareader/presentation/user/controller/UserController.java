package com.mangareader.presentation.user.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.user.usecase.AddRecommendationUseCase;
import com.mangareader.application.user.usecase.GetEnrichedProfileUseCase;
import com.mangareader.application.user.usecase.GetUserCommentsUseCase;
import com.mangareader.application.user.usecase.GetUserProfileUseCase;
import com.mangareader.application.user.usecase.RecordViewHistoryUseCase;
import com.mangareader.application.user.usecase.RemoveRecommendationUseCase;
import com.mangareader.application.user.usecase.ReorderRecommendationsUseCase;
import com.mangareader.application.user.usecase.UpdatePrivacySettingsUseCase;
import com.mangareader.application.user.usecase.UpdateUserProfileUseCase;
import com.mangareader.application.user.usecase.UpdateUserProfileUseCase.SocialLinkInput;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.user.entity.ViewHistory;
import com.mangareader.domain.user.valueobject.VisibilitySetting;
import com.mangareader.application.user.port.ViewHistoryRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.domain.user.entity.User;
import com.mangareader.presentation.user.dto.AddRecommendationRequest;
import com.mangareader.presentation.user.dto.EnrichedProfileResponse;
import com.mangareader.presentation.user.dto.UpdatePrivacyRequest;
import com.mangareader.presentation.user.dto.UpdateProfileRequest;
import com.mangareader.presentation.user.dto.UserProfileResponse;
import com.mangareader.presentation.user.mapper.UserMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.exception.ResourceNotFoundException;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller de perfis de usuário.
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Perfis de usuário")
public class UserController {
    private final GetUserProfileUseCase getUserProfileUseCase;
    private final UpdateUserProfileUseCase updateUserProfileUseCase;
    private final GetEnrichedProfileUseCase getEnrichedProfileUseCase;
    private final AddRecommendationUseCase addRecommendationUseCase;
    private final RemoveRecommendationUseCase removeRecommendationUseCase;
    private final ReorderRecommendationsUseCase reorderRecommendationsUseCase;
    private final UpdatePrivacySettingsUseCase updatePrivacySettingsUseCase;
    private final GetUserCommentsUseCase getUserCommentsUseCase;
    private final RecordViewHistoryUseCase recordViewHistoryUseCase;
    private final ViewHistoryRepositoryPort viewHistoryRepository;
    private final UserRepositoryPort userRepository;

    @GetMapping("/me")
    @Operation(summary = "Meu perfil", description = "Retorna o perfil completo do usuário autenticado")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();

        var user = getUserProfileUseCase.execute(userId);

        return ResponseEntity.ok(ApiResponse.success(UserMapper.toProfileResponse(user)));
    }

    @PatchMapping("/me")
    @Operation(summary = "Atualizar perfil", description = "Atualiza o perfil do usuário autenticado")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMyProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication auth
    ) {
        UUID userId = (UUID) auth.getPrincipal();

        var socialLinks = request.socialLinks() != null
                ? request.socialLinks().stream()
                    .map(sl -> new SocialLinkInput(sl.platform(), sl.url()))
                    .toList()
                : null;

        var input = new UpdateUserProfileUseCase.UpdateProfileInput(
                userId,
                request.name(),
                request.bio(),
                request.photoUrl(),
                request.bannerUrl(),
                socialLinks
        );

        var user = updateUserProfileUseCase.execute(input);

        return ResponseEntity.ok(ApiResponse.success(UserMapper.toProfileResponse(user)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Perfil público", description = "Retorna o perfil público de um usuário")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserProfile(@PathVariable UUID id) {
        var user = getUserProfileUseCase.execute(id);

        return ResponseEntity.ok(ApiResponse.success(UserMapper.toProfileResponse(user)));
    }

    @GetMapping("/me/profile")
    @Operation(summary = "Meu perfil enriquecido")
    public ResponseEntity<ApiResponse<EnrichedProfileResponse>> getMyEnrichedProfile(Authentication auth) {
        UUID userId = (UUID) auth.getPrincipal();

        var profile = getEnrichedProfileUseCase.execute(userId, userId);

        return ResponseEntity.ok(ApiResponse.success(UserMapper.toEnrichedProfileResponse(profile)));
    }

    @GetMapping("/{id}/profile")
    @Operation(summary = "Perfil público enriquecido")
    public ResponseEntity<ApiResponse<EnrichedProfileResponse>> getEnrichedProfile(
            @PathVariable UUID id,
            Authentication auth
    ) {
        UUID viewerUserId = auth != null ? (UUID) auth.getPrincipal() : null;

        var profile = getEnrichedProfileUseCase.execute(id, viewerUserId);

        return ResponseEntity.ok(ApiResponse.success(UserMapper.toEnrichedProfileResponse(profile)));
    }

    @PostMapping("/me/recommendations")
    @Operation(summary = "Adicionar recomendação")
    public ResponseEntity<ApiResponse<EnrichedProfileResponse.RecommendationResponse>> addRecommendation(
            @Valid @RequestBody AddRecommendationRequest request,
            Authentication auth
    ) {
        UUID userId = (UUID) auth.getPrincipal();

        var rec = addRecommendationUseCase.execute(userId, request.titleId());

        var response = new EnrichedProfileResponse.RecommendationResponse(
                rec.getTitleId(), rec.getTitleName(), rec.getTitleCover(), rec.getPosition()
        );

        return ResponseEntity.status(201).body(ApiResponse.created(response));
    }

    @DeleteMapping("/me/recommendations/{titleId}")
    @Operation(summary = "Remover recomendação")
    public ResponseEntity<Void> removeRecommendation(
            @PathVariable String titleId,
            Authentication auth
    ) {
        UUID userId = (UUID) auth.getPrincipal();

        removeRecommendationUseCase.execute(userId, titleId);

        return ResponseEntity.noContent().build();
    }

    @PutMapping("/me/recommendations/order")
    @Operation(summary = "Reordenar recomendações")
    public ResponseEntity<ApiResponse<List<EnrichedProfileResponse.RecommendationResponse>>> reorderRecommendations(
            @RequestBody List<String> titleIds,
            Authentication auth
    ) {
        UUID userId = (UUID) auth.getPrincipal();

        var recs = reorderRecommendationsUseCase.execute(userId, titleIds);

        var response = recs.stream()
                .map(r -> new EnrichedProfileResponse.RecommendationResponse(
                        r.getTitleId(), r.getTitleName(), r.getTitleCover(), r.getPosition()))
                .toList();

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/me/privacy")
    @Operation(summary = "Atualizar privacidade")
    public ResponseEntity<ApiResponse<EnrichedProfileResponse.PrivacySettingsResponse>> updatePrivacy(
            @RequestBody UpdatePrivacyRequest request,
            Authentication auth
    ) {
        UUID userId = (UUID) auth.getPrincipal();

        var input = new UpdatePrivacySettingsUseCase.PrivacyInput(
                userId,
                request.commentVisibility() != null ? VisibilitySetting.valueOf(request.commentVisibility()) : null,
                request.viewHistoryVisibility() != null ? VisibilitySetting.valueOf(request.viewHistoryVisibility()) : null
        );

        var user = updatePrivacySettingsUseCase.execute(input);

        var response = new EnrichedProfileResponse.PrivacySettingsResponse(
                user.getCommentVisibility().name(),
                user.getViewHistoryVisibility().name()
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/comments")
    @Operation(summary = "Comentários do usuário")
    public ResponseEntity<ApiResponse<Page<EnrichedProfileResponse.CommentSummaryResponse>>> getUserComments(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth
    ) {
        UUID viewerUserId = auth != null ? (UUID) auth.getPrincipal() : null;

        Page<Comment> comments = getUserCommentsUseCase.execute(id, viewerUserId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));

        Page<EnrichedProfileResponse.CommentSummaryResponse> response = comments.map(c ->
                new EnrichedProfileResponse.CommentSummaryResponse(
                        c.getId(), c.getTitleId(), c.getTextContent(),
                        c.getCreatedAt() != null ? c.getCreatedAt().toString() : null));

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Histórico de visualização do usuário")
    public ResponseEntity<ApiResponse<Page<EnrichedProfileResponse.ViewHistoryItemResponse>>> getUserHistory(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication auth
    ) {
        UUID viewerUserId = auth != null ? (UUID) auth.getPrincipal() : null;

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        boolean isOwner = viewerUserId != null && viewerUserId.equals(id);

        if (!isOwner && user.getViewHistoryVisibility() != VisibilitySetting.PUBLIC) {
            return ResponseEntity.ok(ApiResponse.success(Page.empty()));
        }

        Page<ViewHistory> history = viewHistoryRepository.findByUserIdOrderByViewedAtDesc(
                id.toString(), PageRequest.of(page, size));

        Page<EnrichedProfileResponse.ViewHistoryItemResponse> response = history.map(vh ->
                new EnrichedProfileResponse.ViewHistoryItemResponse(
                        vh.getTitleId(), vh.getTitleName(), vh.getTitleCover(),
                        vh.getViewedAt() != null ? vh.getViewedAt().toString() : null));

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/me/history")
    @Operation(summary = "Registrar visualização de título")
    public ResponseEntity<Void> recordView(
            @RequestBody java.util.Map<String, String> body,
            Authentication auth
    ) {
        UUID userId = (UUID) auth.getPrincipal();

        String titleId = body.get("titleId");

        if (titleId != null && !titleId.isBlank()) {
            recordViewHistoryUseCase.execute(userId, titleId);
        }

        return ResponseEntity.noContent().build();
    }
}
