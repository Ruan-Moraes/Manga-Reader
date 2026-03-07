package com.mangareader.presentation.user.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.user.usecase.GetUserProfileUseCase;
import com.mangareader.application.user.usecase.UpdateUserProfileUseCase;
import com.mangareader.application.user.usecase.UpdateUserProfileUseCase.SocialLinkInput;
import com.mangareader.presentation.user.dto.UpdateProfileRequest;
import com.mangareader.presentation.user.dto.UserProfileResponse;
import com.mangareader.presentation.user.mapper.UserMapper;
import com.mangareader.shared.dto.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller de perfis de usuário.
 * <p>
 * GET /api/users/{id} — público (perfil de qualquer usuário)
 * GET /api/users/me — autenticado (perfil do usuário logado)
 * PATCH /api/users/me — autenticado (atualiza perfil do usuário logado)
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "Perfis de usuário")
public class UserController {
    private final GetUserProfileUseCase getUserProfileUseCase;
    private final UpdateUserProfileUseCase updateUserProfileUseCase;

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
}
