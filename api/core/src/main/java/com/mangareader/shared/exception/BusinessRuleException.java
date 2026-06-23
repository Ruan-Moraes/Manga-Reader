package com.mangareader.shared.exception;

import com.mangareader.shared.dto.ApiErrorCode;

/**
 * Lançada quando uma regra de negócio é violada.
 * <p>
 * Resulta em HTTP 422 (Unprocessable Entity) por padrão.
 * Opcionalmente carrega um {@link ApiErrorCode} para classificação granular.
 */
public class BusinessRuleException extends RuntimeException {
    private final int statusCode;
    private final String errorCode;

    public BusinessRuleException(String message) {
        super(message);

        this.statusCode = 422;
        this.errorCode = ApiErrorCode.BUSINESS_RULE_VIOLATION;
    }

    public BusinessRuleException(String message, int statusCode) {
        super(message);

        this.statusCode = statusCode;
        this.errorCode = ApiErrorCode.BUSINESS_RULE_VIOLATION;
    }

    public BusinessRuleException(String message, int statusCode, String errorCode) {
        super(message);

        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }

    public int getStatusCode() {
        return statusCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}
