package com.mangareader.infrastructure.persistence.mongo;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.testcontainers.containers.MongoDBContainer;

@TestConfiguration
public class MongoTestContainerConfig {

    @Bean
    @ServiceConnection
    static MongoDBContainer mongoDBContainer() {
        return new MongoDBContainer("mongo:8.0");
    }
}
