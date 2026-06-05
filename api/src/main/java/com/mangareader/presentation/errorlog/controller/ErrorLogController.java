package com.mangareader.presentation.errorlog.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.errorlog.usecase.CreateErrorLogUseCase;
import com.mangareader.domain.errorlog.entity.ErrorLog;
import com.mangareader.presentation.errorlog.dto.CreateErrorLogRequest;
import com.mangareader.presentation.errorlog.dto.ErrorLogResponse;
import com.mangareader.presentation.errorlog.mapper.ErrorLogMapper;
import com.mangareader.shared.dto.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller de registro de erros do frontend.
 * <p>
 * POST é público — erros podem ocorrer antes do login.
 */
@RestController
@RequestMapping("/api/error-logs")
@RequiredArgsConstructor
@Tag(name = "Error Logs", description = "Registro de erros capturados no frontend")
public class ErrorLogController {
    private final CreateErrorLogUseCase createErrorLogUseCase;

    @PostMapping
    @Operation(summary = "Registrar um erro do frontend")
    public ResponseEntity<ApiResponse<ErrorLogResponse>> create(
            @Valid @RequestBody CreateErrorLogRequest request
    ) {
        ErrorLog errorLog = createErrorLogUseCase.execute(ErrorLogMapper.toInput(request));

        ErrorLogResponse response = ErrorLogMapper.toResponse(errorLog);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.created(response));
    }
}
