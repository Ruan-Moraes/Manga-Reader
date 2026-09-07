package com.toonlira.presentation.auth.dto;

public record ForgotPasswordResponse(String message, long expiresInSeconds) {
}
