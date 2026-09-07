package com.toonlira.application.errorlog.port;

import com.toonlira.domain.errorlog.entity.ErrorLog;

/**
 * Port de saída — acesso a dados de ErrorLog (MongoDB).
 */
public interface ErrorLogRepositoryPort {
    ErrorLog save(ErrorLog errorLog);
}
