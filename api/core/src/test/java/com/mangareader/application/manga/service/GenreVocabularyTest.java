package com.mangareader.application.manga.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Locale;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;
import com.mangareader.shared.domain.i18n.LocalizedString;

@ExtendWith(MockitoExtension.class)
@DisplayName("GenreVocabulary")
class GenreVocabularyTest {

    @Mock
    private TagRepositoryPort tagRepository;

    @InjectMocks
    private GenreVocabulary genreVocabulary;

    private static Tag tag(String slug, String pt) {
        return Tag.builder().slug(slug).label(LocalizedString.ofDefault(pt)).build();
    }

    @Test
    @DisplayName("Monta mapa slug → label; ignora tags sem slug")
    void montaMapa() {
        when(tagRepository.findAll()).thenReturn(List.of(
                tag("ACTION", "Ação"),
                tag("DRAMA", "Drama"),
                Tag.builder().label(LocalizedString.ofDefault("Sem slug")).build()));

        var bySlug = genreVocabulary.bySlug();

        assertThat(bySlug).containsOnlyKeys("ACTION", "DRAMA");
        assertThat(bySlug.get("ACTION").resolve(Locale.forLanguageTag("pt-BR"))).isEqualTo("Ação");
    }

    @Test
    @DisplayName("Cache: segunda chamada dentro do TTL não reconsulta o repositório")
    void cacheEvitaSegundaConsulta() {
        when(tagRepository.findAll()).thenReturn(List.of(tag("ACTION", "Ação")));

        genreVocabulary.bySlug();
        genreVocabulary.bySlug();

        verify(tagRepository, times(1)).findAll();
    }
}
