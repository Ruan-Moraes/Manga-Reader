package com.mangareader.presentation.auth.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.auth.usecase.ForgotPasswordUseCase;
import com.mangareader.application.auth.usecase.GetCurrentUserUseCase;
import com.mangareader.application.auth.usecase.RefreshTokenUseCase;
import com.mangareader.application.auth.usecase.ResetPasswordUseCase;
import com.mangareader.application.auth.usecase.SignInUseCase;
import com.mangareader.application.auth.usecase.SignUpUseCase;
import com.mangareader.domain.user.entity.User;
import com.mangareader.presentation.auth.dto.AuthResponse;
import com.mangareader.presentation.auth.dto.ForgotPasswordRequest;
import com.mangareader.presentation.auth.dto.RefreshTokenRequest;
import com.mangareader.presentation.auth.dto.ResetPasswordRequest;
import com.mangareader.presentation.auth.dto.SignInRequest;
import com.mangareader.presentation.auth.dto.SignUpRequest;
import com.mangareader.shared.dto.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller de autenticação.
 * <p>
 * Endpoints públicos: sign-in, sign-up, refresh.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Autenticação e gerenciamento de sessão")
public class AuthController {
    private final SignInUseCase signInUseCase;
    private final SignUpUseCase signUpUseCase;
    private final RefreshTokenUseCase refreshTokenUseCase;
    private final GetCurrentUserUseCase getCurrentUserUseCase;
    private final ForgotPasswordUseCase forgotPasswordUseCase;
    private final ResetPasswordUseCase resetPasswordUseCase;

    @PostMapping("/sign-in")
    @Operation(summary = "Login", description = "Autentica o usuário e retorna tokens JWT")
    public ResponseEntity<ApiResponse<AuthResponse>> signIn(
            @Valid @RequestBody SignInRequest request
    ) {
        var input = new SignInUseCase.SignInInput(request.email(), request.password());

        var output = signInUseCase.execute(input);

        var response = new AuthResponse(
                output.accessToken(),
                output.refreshToken(),
                output.userId(),
                output.name(),
                output.email(),
                output.role(),
                output.photoUrl()
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/sign-up")
    @Operation(summary = "Cadastro", description = "Cria um novo usuário e retorna tokens JWT")
    public ResponseEntity<ApiResponse<AuthResponse>> signUp(
            @Valid @RequestBody SignUpRequest request
    ) {
        var input = new SignUpUseCase.SignUpInput(
                request.name(), request.email(), request.password()
        );

        var output = signUpUseCase.execute(input);

        var response = new AuthResponse(
                output.accessToken(),
                output.refreshToken(),
                output.userId(),
                output.name(),
                output.email(),
                output.role(),
                null
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh token", description = "Renova os tokens JWT via refresh token")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request
    ) {
        var input = new RefreshTokenUseCase.RefreshInput(request.refreshToken());

        var output = refreshTokenUseCase.execute(input);

        var response = new AuthResponse(
                output.accessToken(),
                output.refreshToken(),
                null, null, null, null, null
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    @Operation(summary = "Usuário atual", description = "Retorna os dados do usuário autenticado")
    public ResponseEntity<ApiResponse<AuthResponse>> getCurrentUser(Authentication auth) {
        UUID userId = null;

        try {
            userId = (UUID) auth.getPrincipal();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Acesso não autorizado. Usuário não autenticado ou token inválido.", 401));

        }

        User user = getCurrentUserUseCase.execute(userId);

        var response = new AuthResponse(
                null, null,
                user.getId().toString(),
                user.getName(),
                user.getEmail(),
                user.getRole().name(),
                user.getPhotoUrl()
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Esqueci a senha", description = "Envia token de redefinição de senha (logado no console em dev)")
    public ResponseEntity<ApiResponse<String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request
    ) {
        forgotPasswordUseCase.execute(request.email());

        return ResponseEntity.ok(ApiResponse.success(
                "Se o email estiver cadastrado, um link de redefinição será enviado."
        ));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Redefinir senha", description = "Redefine a senha usando o token de reset")
    public ResponseEntity<ApiResponse<String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        resetPasswordUseCase.execute(request.token(), request.newPassword());

        return ResponseEntity.ok(ApiResponse.success("Senha redefinida com sucesso."));
    }
}
