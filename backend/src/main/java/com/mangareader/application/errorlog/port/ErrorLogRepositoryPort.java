package com.mangareader.application.errorlog.port;

import com.mangareader.domain.errorlog.entity.ErrorLog;

/**
 * Port de saída — acesso a dados de ErrorLog (MongoDB).
 */
public interface ErrorLogRepositoryPort {
    ErrorLog save(ErrorLog errorLog);
}
