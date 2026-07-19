package com.mangareader.presentation.user.controller;

import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.user.usecase.ExportUserDataUseCase;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/users/me/data-export")
@RequiredArgsConstructor
public class UserDataExportController {
    private final ExportUserDataUseCase exportUserData;

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ExportUserDataUseCase.ExportData> export(Authentication authentication) {
        UUID userId = (UUID) authentication.getPrincipal();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=behavior-data-export.json")
                .body(exportUserData.execute(userId));
    }
}
