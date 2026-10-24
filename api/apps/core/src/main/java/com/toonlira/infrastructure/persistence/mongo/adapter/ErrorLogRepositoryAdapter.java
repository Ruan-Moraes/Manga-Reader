package com.toonlira.infrastructure.persistence.mongo.adapter;

import org.springframework.stereotype.Component;

import com.toonlira.application.errorlog.port.ErrorLogRepositoryPort;
import com.toonlira.domain.errorlog.entity.ErrorLog;
import com.toonlira.infrastructure.persistence.mongo.repository.ErrorLogMongoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de ErrorLog ao Spring Data MongoDB.
 */
@Component
@RequiredArgsConstructor
public class ErrorLogRepositoryAdapter implements ErrorLogRepositoryPort {
    private final ErrorLogMongoRepository repository;

    @Override
    public ErrorLog save(ErrorLog errorLog) {
        return repository.save(errorLog);
    }
}
