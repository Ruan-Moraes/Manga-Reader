package com.mangareader.shared.exception;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import com.mangareader.shared.dto.ApiErrorCode;
import com.mangareader.shared.dto.ApiErrorResponse;
import com.mangareader.shared.dto.ValidationErrorResponse;

import jakarta.validation.ConstraintViolationException;

/**
 * Handler global de exceções.
 * <p>
 * Todas as respostas de erro seguem o formato padronizado:
 * <pre>{ success: false, code: string, message: string, statusCode: number }</pre>
 * <p>
 * O campo {@code code} contém um {@link ApiErrorCode} que o frontend mapeia
 * para mensagens amigáveis ao usuário.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleResourceNotFound(ResourceNotFoundException ex) {
        log.warn("Recurso não encontrado: {}", ex.getMessage());

        var body = new ApiErrorResponse(
                ApiErrorCode.RESOURCE_NOT_FOUND,
                ex.getMessage(),
                HttpStatus.NOT_FOUND.value()
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoResourceFound(NoResourceFoundException ex) {
        var body = new ApiErrorResponse(
                ApiErrorCode.RESOURCE_NOT_FOUND,
                "Recurso não encontrado.",
                HttpStatus.NOT_FOUND.value()
        );

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiErrorResponse> handleDuplicate(DuplicateResourceException ex) {
        log.warn("Recurso duplicado: {}", ex.getMessage());

        var body = new ApiErrorResponse(
                ApiErrorCode.RESOURCE_DUPLICATE,
                ex.getMessage(),
                HttpStatus.CONFLICT.value()
        );

        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ApiErrorResponse> handleBusinessRule(BusinessRuleException ex) {
        log.warn("Regra de negócio violada: {}", ex.getMessage());

        var status = HttpStatus.valueOf(ex.getStatusCode());

        var body = new ApiErrorResponse(
                ex.getErrorCode(),
                ex.getMessage(),
                ex.getStatusCode()
        );

        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ValidationErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();

        ex.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.put(error.getField(), error.getDefaultMessage())
        );

        log.warn("Falha de validação: {}", fieldErrors);

        var body = new ValidationErrorResponse("Os dados enviados são inválidos.", fieldErrors);

        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ValidationErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        Map<String, String> fieldErrors = new HashMap<>();

        ex.getConstraintViolations().forEach(violation -> {
            String field = violation.getPropertyPath().toString();

            fieldErrors.put(field, violation.getMessage());
        });

        log.warn("Violação de constraint: {}", fieldErrors);

        var body = new ValidationErrorResponse("Os dados enviados são inválidos.", fieldErrors);

        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleNotReadable(HttpMessageNotReadableException ex) {
        log.warn("JSON inválido: {}", ex.getMessage());

        var body = new ApiErrorResponse(
                ApiErrorCode.VALIDATION_BAD_REQUEST,
                "Requisição inválida. Verifique os dados enviados.",
                HttpStatus.BAD_REQUEST.value()
        );

        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        log.warn("Tipo de argumento inválido: {} — esperado: {}", ex.getValue(), ex.getRequiredType());

        var body = new ApiErrorResponse(
                ApiErrorCode.VALIDATION_TYPE_MISMATCH,
                "Requisição inválida. Verifique os dados enviados.",
                HttpStatus.BAD_REQUEST.value()
        );

        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGeneric(Exception ex) {
        log.error("Erro interno não tratado", ex);

        var body = new ApiErrorResponse(
                ApiErrorCode.INTERNAL_SERVER_ERROR,
                "Erro interno do servidor. Tente novamente mais tarde.",
                HttpStatus.INTERNAL_SERVER_ERROR.value()
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
