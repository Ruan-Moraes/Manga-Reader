package com.mangareader.domain.category.entity;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.category.valueobject.PublicationStatus;
import com.mangareader.domain.category.valueobject.SortCriteria;
import com.mangareader.shared.domain.i18n.LocalizedString;

class TagTest {

    @Nested
    @DisplayName("Builder")
    class BuilderTests {

        @Test
        @DisplayName("Deve criar tag com label via builder")
        void shouldCreateTagWithLabel() {
            Tag tag = Tag.builder()
                    .label(LocalizedString.ofDefault("Action"))
                    .build();

            assertThat(tag.getLabel().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("Action");
            assertThat(tag.getId()).isNull();
        }

        @Test
        @DisplayName("Deve criar tag com id e label via builder")
        void shouldCreateTagWithIdAndLabel() {
            Tag tag = Tag.builder()
                    .id(1L)
                    .label(LocalizedString.ofDefault("Romance"))
                    .build();

            assertThat(tag.getId()).isEqualTo(1L);
            assertThat(tag.getLabel().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("Romance");
        }

        @Test
        @DisplayName("Builder sem label deve usar default empty")
        void builderDefaultEmpty() {
            Tag tag = Tag.builder().build();
            assertThat(tag.getLabel()).isNotNull();
            assertThat(tag.getLabel().isEmpty()).isTrue();
        }
    }

    @Nested
    @DisplayName("Mutação via setters")
    class MutationTests {

        @Test
        @DisplayName("Deve permitir alterar label via setter")
        void shouldAllowLabelUpdate() {
            Tag tag = Tag.builder()
                    .label(LocalizedString.ofDefault("Ação"))
                    .build();

            tag.setLabel(LocalizedString.ofDefault("Action"));
            assertThat(tag.getLabel().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("Action");
        }
    }

    @Nested
    @DisplayName("AllArgsConstructor")
    class AllArgsTests {

        @Test
        @DisplayName("Deve criar tag via AllArgsConstructor")
        void shouldCreateViaAllArgs() {
            Tag tag = new Tag(5L, LocalizedString.ofDefault("Fantasy"));

            assertThat(tag.getId()).isEqualTo(5L);
            assertThat(tag.getLabel().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("Fantasy");
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter id nulo")
        void shouldKeepIdNullOnNoArgsConstructor() {
            Tag tag = new Tag();

            assertThat(tag.getId()).isNull();
        }
    }

    @Nested
    @DisplayName("SortCriteria enum")
    class SortCriteriaTests {

        @Test
        @DisplayName("Deve ter 6 critérios de ordenação")
        void shouldHaveSixSortCriteria() {
            assertThat(SortCriteria.values().length).isEqualTo(6);
        }

        @Test
        @DisplayName("Deve conter todos os critérios esperados")
        void shouldContainExpectedCriteria() {
            SortCriteria[] values = SortCriteria.values();
            assertThat(values[0]).isEqualTo(SortCriteria.MOST_READ);
            assertThat(values[1]).isEqualTo(SortCriteria.MOST_RATED);
            assertThat(values[2]).isEqualTo(SortCriteria.MOST_RECENT);
            assertThat(values[3]).isEqualTo(SortCriteria.ALPHABETICAL);
            assertThat(values[4]).isEqualTo(SortCriteria.ASCENSION);
            assertThat(values[5]).isEqualTo(SortCriteria.RANDOM);
        }

        @Test
        @DisplayName("Deve converter string para enum via valueOf")
        void shouldConvertFromStringViaValueOf() {
            assertThat(SortCriteria.valueOf("MOST_READ")).isEqualTo(SortCriteria.MOST_READ);
            assertThat(SortCriteria.valueOf("ALPHABETICAL")).isEqualTo(SortCriteria.ALPHABETICAL);
        }
    }

    @Nested
    @DisplayName("PublicationStatus enum")
    class PublicationStatusTests {

        @Test
        @DisplayName("Deve ter 5 status de publicação")
        void shouldHaveFiveStatuses() {
            assertThat(PublicationStatus.values().length).isEqualTo(5);
        }

        @Test
        @DisplayName("Deve conter status ALL como filtro geral")
        void shouldContainAllAsGeneralFilter() {
            PublicationStatus all = PublicationStatus.ALL;
            assertThat(all.name()).isEqualTo("ALL");
        }

        @Test
        @DisplayName("Deve converter string para enum via valueOf")
        void shouldConvertFromStringViaValueOf() {
            assertThat(PublicationStatus.valueOf("COMPLETE")).isEqualTo(PublicationStatus.COMPLETE);
            assertThat(PublicationStatus.valueOf("ONGOING")).isEqualTo(PublicationStatus.ONGOING);
            assertThat(PublicationStatus.valueOf("HIATUS")).isEqualTo(PublicationStatus.HIATUS);
            assertThat(PublicationStatus.valueOf("CANCELLED")).isEqualTo(PublicationStatus.CANCELLED);
        }
    }
}
