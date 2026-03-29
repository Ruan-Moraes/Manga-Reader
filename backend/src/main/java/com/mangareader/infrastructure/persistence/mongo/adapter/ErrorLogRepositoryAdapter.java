package com.mangareader.infrastructure.persistence.mongo.adapter;

import org.springframework.stereotype.Component;

import com.mangareader.application.errorlog.port.ErrorLogRepositoryPort;
import com.mangareader.domain.errorlog.entity.ErrorLog;
import com.mangareader.infrastructure.persistence.mongo.repository.ErrorLogMongoRepository;

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
