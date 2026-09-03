package com.mangareader.domain.errorlog.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Registro de erro capturado no frontend (MongoDB).
 * <p>
 * Armazena message, stackTrace, source (error-boundary, unhandled-rejection,
 * window-error), URL da página, userAgent e userId opcional.
 */
@Document(collection = "error_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ErrorLog {
    @Id
    private String id;

    private String message;

    private String stackTrace;

    @Indexed
    private String source;

    private String url;

    private String userAgent;

    /** Nullable — o usuário pode não estar autenticado. */
    @Indexed
    private String userId;

    @CreatedDate
    private LocalDateTime createdAt;
}
