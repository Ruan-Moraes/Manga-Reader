package com.mangareader.shared.config;

import java.time.Duration;
import java.util.Map;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.mangareader.shared.constant.CacheNames;

/**
 * Configuração do Redis como provedor de cache.
 * <p>
 * Define TTLs individuais por cache para equilibrar freshness e performance.
 * Desabilitado no profile "test" (usa {@code spring.cache.type=none}).
 */
@Configuration
@EnableCaching
@Profile("!test")
public class CacheConfig {
    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        var jsonSerializer = RedisSerializationContext.SerializationPair
                .fromSerializer(redisJsonSerializer());

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(jsonSerializer)
                .disableCachingNullValues()
                .entryTtl(Duration.ofMinutes(5));

        Map<String, RedisCacheConfiguration> perCacheTtl = Map.of(
                CacheNames.TITLE,               defaultConfig.entryTtl(Duration.ofMinutes(10)),
                CacheNames.TAG,                 defaultConfig.entryTtl(Duration.ofMinutes(30)),
                CacheNames.RATING_AVERAGE,      defaultConfig.entryTtl(Duration.ofMinutes(2)),
                CacheNames.PUBLIC_STATS,        defaultConfig.entryTtl(Duration.ofMinutes(30)),
                CacheNames.SUBSCRIPTION_PLANS,  defaultConfig.entryTtl(Duration.ofHours(1))
        );

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(perCacheTtl)
                .transactionAware()
                .build();
    }

    static GenericJackson2JsonRedisSerializer redisJsonSerializer() {
        var mapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        return GenericJackson2JsonRedisSerializer.builder()
                .objectMapper(mapper)
                .defaultTyping(true)
                .build();
    }
}
