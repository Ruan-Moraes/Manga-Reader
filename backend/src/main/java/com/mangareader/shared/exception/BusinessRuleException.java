package com.mangareader.shared.exception;

/**
 * Lançada quando uma regra de negócio é violada.
 * <p>
 * Resulta em HTTP 422 (Unprocessable Entity) por padrão.
 */
public class BusinessRuleException extends RuntimeException {

    private final int statusCode;

    public BusinessRuleException(String message) {
        super(message);
        this.statusCode = 422;
    }

    public BusinessRuleException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
