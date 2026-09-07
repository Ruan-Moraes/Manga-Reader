package com.toonlira.infrastructure.persistence.mongo.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.toonlira.domain.errorlog.entity.ErrorLog;

/**
 * Spring Data MongoDB repository para ErrorLog.
 */
public interface ErrorLogMongoRepository extends MongoRepository<ErrorLog, String> {
}
