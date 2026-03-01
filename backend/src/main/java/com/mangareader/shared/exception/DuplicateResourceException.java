package com.mangareader.shared.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Lançada quando há tentativa de criar um recurso que viola uma restrição de unicidade.
 * <p>
 * Exemplo: e-mail ou username já cadastrado.
 * Resulta em HTTP 409 (Conflict).
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateResourceException extends RuntimeException {

    private final String resourceName;
    private final String fieldName;
    private final Object fieldValue;

    public DuplicateResourceException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s já existe com %s: '%s'", resourceName, fieldName, fieldValue));
        this.resourceName = resourceName;
        this.fieldName = fieldName;
        this.fieldValue = fieldValue;
    }

    public String getResourceName() {
        return resourceName;
    }

    public String getFieldName() {
        return fieldName;
    }

    public Object getFieldValue() {
        return fieldValue;
    }
}
