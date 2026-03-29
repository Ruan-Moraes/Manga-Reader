package com.mangareader.application.errorlog.usecase;

import org.springframework.stereotype.Service;

import com.mangareader.application.errorlog.port.ErrorLogRepositoryPort;
import com.mangareader.domain.errorlog.entity.ErrorLog;

import lombok.RequiredArgsConstructor;

/**
 * Cria um novo registro de erro reportado pelo frontend.
 */
@Service
@RequiredArgsConstructor
public class CreateErrorLogUseCase {
    private final ErrorLogRepositoryPort errorLogRepository;

    public record CreateErrorLogInput(
            String message,
            String stackTrace,
            String source,
            String url,
            String userAgent,
            String userId
    ) {}

    public ErrorLog execute(CreateErrorLogInput input) {
        ErrorLog errorLog = ErrorLog.builder()
                .message(input.message())
                .stackTrace(input.stackTrace())
                .source(input.source())
                .url(input.url())
                .userAgent(input.userAgent())
                .userId(input.userId())
                .build();

        return errorLogRepository.save(errorLog);
    }
}
