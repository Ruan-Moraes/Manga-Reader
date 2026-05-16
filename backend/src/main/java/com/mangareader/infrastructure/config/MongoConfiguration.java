package com.mangareader.infrastructure.config;

import java.util.List;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

import com.mangareader.infrastructure.persistence.mongo.converter.LocalizedStringMongoConverters;
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;

@Configuration
public class MongoConfiguration extends AbstractMongoClientConfiguration {
    @Value("${spring.data.mongodb.uri}")
    private String mongoUri;

    @Override
    protected String getDatabaseName() {
        ConnectionString connectionString = new ConnectionString(mongoUri);

        return connectionString.getDatabase();
    }

    @Override
    @Bean
    public MongoClient mongoClient() {
        ConnectionString connectionString = new ConnectionString(mongoUri);

        MongoClientSettings mongoClientSettings = MongoClientSettings.builder()
                .applyConnectionString(connectionString)
                .applyToSocketSettings(builder -> builder
                        .connectTimeout(10, TimeUnit.SECONDS)
                        .readTimeout(10, TimeUnit.SECONDS))
                .applyToClusterSettings(builder -> builder
                        .serverSelectionTimeout(10, TimeUnit.SECONDS))
                .retryWrites(false)
                .build();

        return MongoClients.create(mongoClientSettings);
    }

    /**
     * Flipped by {@link #customConversions()} or by test configurations that
     * provide their own {@link MongoCustomConversions} bean (e.g.
     * {@code MongoTestContainerConfig#mongoCustomConversions}). Verified
     * after context refresh.
     */
    public static volatile boolean localizedStringConvertersRegistered = false;

    @Override
    @Bean
    public MongoCustomConversions customConversions() {
        var conversions = new MongoCustomConversions(List.of(
                new LocalizedStringMongoConverters.LocalizedStringWriter(),
                new LocalizedStringMongoConverters.LocalizedStringReader(),
                new LocalizedStringMongoConverters.LocalizedStringListWriter(),
                new LocalizedStringMongoConverters.LocalizedStringListReader()
        ));

        localizedStringConvertersRegistered = true;

        return conversions;
    }

    /**
     * Fail-fast startup guard: ensures bean factory invoked
     * {@link #customConversions()} and registered LocalizedString converters.
     * Without these, Spring Data Mongo would silently serialize
     * {@code LocalizedString} as {@code {"values": {...}}} instead of the
     * expected flat document — corrupting data while leaving boot apparently
     * healthy.
     *
     * <p>Runs at {@link ContextRefreshedEvent} (após todos beans wired) — não
     * @PostConstruct, pois @Bean factory methods do mesmo @Configuration
     * podem não ter sido invocados quando @PostConstruct dispara.
     */
    @EventListener(ContextRefreshedEvent.class)
    void verifyLocalizedStringConvertersRegistered() {
        if (!localizedStringConvertersRegistered) {
            throw new IllegalStateException(
                    "LocalizedString Mongo converters not registered — re-add to MongoConfiguration#customConversions()."
            );
        }
    }
}
