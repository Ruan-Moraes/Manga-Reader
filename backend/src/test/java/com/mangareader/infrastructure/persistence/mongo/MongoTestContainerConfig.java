package com.mangareader.infrastructure.persistence.mongo;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;
import org.testcontainers.containers.MongoDBContainer;

import com.mangareader.infrastructure.persistence.mongo.converter.LocalizedStringMongoConverters;

/**
 * DT-20: container Mongo <strong>singleton por JVM</strong>. Antes, cada
 * contexto Spring (13 classes {@code @DataMongoTest}) podia subir/derrubar o
 * próprio container; sob Docker lento o primeiro acesso pegava o container
 * ainda em {@code health: starting} → {@code DataAccessResourceFailure:
 * Connection refused} (flake de CI).
 *
 * <p>Agora: instância única iniciada uma vez em bloco {@code static} com
 * espera explícita de startup; {@link #stop()} é no-op para que o fechamento
 * de qualquer contexto Spring (cache LRU) não derrube o container enquanto
 * outro contexto ainda o usa. Ryuk limpa no fim da JVM.
 */
@TestConfiguration
public class MongoTestContainerConfig {

    private static final MongoDBContainer MONGO_CONTAINER;

    static {
        MONGO_CONTAINER = new MongoDBContainer("mongo:8.0") {
            @Override
            public void stop() {
                // Singleton: ignorar stop por fechamento de contexto Spring.
                // Container vive toda a suíte; Ryuk remove ao fim da JVM.
            }
        };
        MONGO_CONTAINER.withStartupTimeout(Duration.ofSeconds(120));
        MONGO_CONTAINER.start();
    }

    @Bean
    @ServiceConnection
    MongoDBContainer mongoDBContainer() {
        return MONGO_CONTAINER;
    }

    /**
     * Acesso ao container singleton para testes que precisam semear dados
     * <strong>antes</strong> do contexto Spring subir (ex.: validar V009 pela
     * orquestração real do Mongock — DT-21).
     */
    public static MongoDBContainer sharedContainer() {
        return MONGO_CONTAINER;
    }

    @Bean
    public MongoCustomConversions mongoCustomConversions() {
        var conversions = new MongoCustomConversions(List.of(
                new LocalizedStringMongoConverters.LocalizedStringWriter(),
                new LocalizedStringMongoConverters.LocalizedStringReader(),
                new LocalizedStringMongoConverters.LocalizedStringListWriter(),
                new LocalizedStringMongoConverters.LocalizedStringListReader()
        ));
        com.mangareader.infrastructure.config.MongoConfiguration.localizedStringConvertersRegistered = true;
        return conversions;
    }
}
