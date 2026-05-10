package com.mangareader.infrastructure.persistence.mongo;

import java.util.List;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.testcontainers.containers.MongoDBContainer;

import com.mangareader.infrastructure.persistence.mongo.converter.LocalizedStringMongoConverters;

@TestConfiguration
public class MongoTestContainerConfig {

    @Bean
    @ServiceConnection
    static MongoDBContainer mongoDBContainer() {
        return new MongoDBContainer("mongo:8.0");
    }

    @Bean
    public MongoCustomConversions mongoCustomConversions() {
        return new MongoCustomConversions(List.of(
                new LocalizedStringMongoConverters.LocalizedStringWriter(),
                new LocalizedStringMongoConverters.LocalizedStringReader(),
                new LocalizedStringMongoConverters.LocalizedStringListWriter(),
                new LocalizedStringMongoConverters.LocalizedStringListReader()
        ));
    }
}
