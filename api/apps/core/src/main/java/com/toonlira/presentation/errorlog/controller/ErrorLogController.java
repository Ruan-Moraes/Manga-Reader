package com.toonlira.presentation.errorlog.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.toonlira.application.errorlog.usecase.CreateErrorLogUseCase;
import com.toonlira.domain.errorlog.entity.ErrorLog;
import com.toonlira.presentation.errorlog.dto.CreateErrorLogRequest;
import com.toonlira.presentation.errorlog.dto.ErrorLogResponse;
import com.toonlira.presentation.errorlog.mapper.ErrorLogMapper;
import com.toonlira.shared.dto.ApiResponse;

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
