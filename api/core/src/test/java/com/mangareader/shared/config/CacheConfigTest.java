package com.mangareader.shared.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.manga.entity.Title;
import com.mangareader.shared.domain.i18n.LocalizedString;

@DisplayName("CacheConfig")
class CacheConfigTest {
    @Test
    @DisplayName("Serializer Redis suporta LocalDateTime em entidades cacheadas")
    void redisSerializerSupportsLocalDateTime() {
        var serializer = CacheConfig.redisJsonSerializer();
        var updatedAt = LocalDateTime.of(2026, 6, 20, 11, 35, 7);
        var title = Title.builder()
                .id("2")
                .name(LocalizedString.of(Map.of("pt-BR", "Ola", "en-US", "Hello")))
                .synopsis(LocalizedString.ofDefault("Sinopse"))
                .updatedAt(updatedAt)
                .build();

        byte[] bytes = serializer.serialize(title);
        var back = (Title) serializer.deserialize(bytes);

        assertThat(back.getUpdatedAt()).isEqualTo(updatedAt);
        assertThat(back.getName()).isEqualTo(title.getName());
        assertThat(back.getName().resolve(Locale.forLanguageTag("en-US"))).isEqualTo("Hello");
    }
}
