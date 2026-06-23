package com.mangareader.presentation.errorlog.mapper;

import com.mangareader.application.errorlog.usecase.CreateErrorLogUseCase.CreateErrorLogInput;
import com.mangareader.domain.errorlog.entity.ErrorLog;
import com.mangareader.presentation.errorlog.dto.CreateErrorLogRequest;
import com.mangareader.presentation.errorlog.dto.ErrorLogResponse;

/**
 * Mapper estático para conversão DTO ↔ input/entity no domínio ErrorLog.
 */
public final class ErrorLogMapper {
    private ErrorLogMapper() {}

    public static CreateErrorLogInput toInput(CreateErrorLogRequest request) {
        return new CreateErrorLogInput(
                request.message(),
                request.stackTrace(),
                request.source(),
                request.url(),
                request.userAgent(),
                request.userId()
        );
    }

    public static ErrorLogResponse toResponse(ErrorLog errorLog) {
        return new ErrorLogResponse(
                errorLog.getId(),
                errorLog.getMessage(),
                errorLog.getSource(),
                errorLog.getCreatedAt()
        );
    }
}
