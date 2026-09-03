package com.mangareader.infrastructure.persistence.mongo.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.domain.errorlog.entity.ErrorLog;

/**
 * Spring Data MongoDB repository para ErrorLog.
 */
public interface ErrorLogMongoRepository extends MongoRepository<ErrorLog, String> {
}
