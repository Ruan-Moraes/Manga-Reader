package com.mangareader.domain.news.valueobject;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class NewsSlugTest {
    @Test
    void shouldCreateCanonicalSlug() {
        assertThat(NewsSlug.from("  Mangá: A Ascensão!  ")).isEqualTo("manga-a-ascensao");
    }
}
