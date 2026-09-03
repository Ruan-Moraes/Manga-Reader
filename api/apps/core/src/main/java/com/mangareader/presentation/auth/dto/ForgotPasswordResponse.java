package com.mangareader.presentation.auth.dto;

public record ForgotPasswordResponse(String message, long expiresInSeconds) {
}
