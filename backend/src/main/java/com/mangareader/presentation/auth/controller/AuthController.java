package com.mangareader.presentation.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.auth.usecase.RefreshTokenUseCase;
import com.mangareader.application.auth.usecase.SignInUseCase;
import com.mangareader.application.auth.usecase.SignUpUseCase;
import com.mangareader.presentation.auth.dto.AuthResponse;
import com.mangareader.presentation.auth.dto.RefreshTokenRequest;
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
}
