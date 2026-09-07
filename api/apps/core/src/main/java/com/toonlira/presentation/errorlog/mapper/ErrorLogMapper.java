package com.toonlira.presentation.errorlog.mapper;

import com.toonlira.application.errorlog.usecase.CreateErrorLogUseCase.CreateErrorLogInput;
import com.toonlira.domain.errorlog.entity.ErrorLog;
import com.toonlira.presentation.errorlog.dto.CreateErrorLogRequest;
import com.toonlira.presentation.errorlog.dto.ErrorLogResponse;

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
