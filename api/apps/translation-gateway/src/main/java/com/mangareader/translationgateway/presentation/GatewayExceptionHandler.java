package com.mangareader.translationgateway.presentation;

import com.mangareader.translationgateway.domain.GatewayErrorCode;
import com.mangareader.translationgateway.domain.GatewayException;
import jakarta.validation.ConstraintViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestValueException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestControllerAdvice
public class GatewayExceptionHandler {
    private static final Logger LOGGER = LoggerFactory.getLogger(GatewayExceptionHandler.class);

    @ExceptionHandler(GatewayException.class)
    ResponseEntity<GatewayProblem> gateway(GatewayException error) {
        var builder = ResponseEntity.status(error.status()).contentType(MediaType.APPLICATION_PROBLEM_JSON);
        if (error.status() == 429) builder.header(HttpHeaders.RETRY_AFTER, "86400");
        return builder.body(GatewayProblem.of(error.code(), error.status(), error.retryable()));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<GatewayProblem> tooLarge() {
        return ResponseEntity.status(413).contentType(MediaType.APPLICATION_PROBLEM_JSON)
            .body(GatewayProblem.of(GatewayErrorCode.PAYLOAD_TOO_LARGE, 413, false));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    ResponseEntity<GatewayProblem> unsupportedMediaType() {
        return ResponseEntity.status(415).contentType(MediaType.APPLICATION_PROBLEM_JSON)
            .body(GatewayProblem.of(GatewayErrorCode.UNSUPPORTED_MEDIA_TYPE, 415, false));
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, MissingRequestValueException.class,
        HttpMessageNotReadableException.class, ConstraintViolationException.class, IllegalArgumentException.class})
    ResponseEntity<GatewayProblem> invalidRequest() {
        return ResponseEntity.badRequest().contentType(MediaType.APPLICATION_PROBLEM_JSON)
            .body(GatewayProblem.of(GatewayErrorCode.INVALID_REQUEST, 400, false));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<GatewayProblem> unexpected(Exception error) {
        var problem = GatewayProblem.of(GatewayErrorCode.INTERNAL_ERROR, 500, true);
        LOGGER.error("event=gateway_request_failed error_code={} correlation_ref={} exception_type={}",
            problem.code(), problem.correlationRef(), error.getClass().getSimpleName());
        return ResponseEntity.internalServerError().contentType(MediaType.APPLICATION_PROBLEM_JSON).body(problem);
    }
}
