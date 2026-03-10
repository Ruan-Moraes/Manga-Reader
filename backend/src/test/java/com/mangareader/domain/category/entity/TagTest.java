package com.mangareader.domain.category.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.category.valueobject.PublicationStatus;
import com.mangareader.domain.category.valueobject.SortCriteria;

class TagTest {

    @Nested
    @DisplayName("Builder")
    class BuilderTests {

        @Test
        @DisplayName("Deve criar tag com label via builder")
        void shouldCreateTagWithLabel() {
            Tag tag = Tag.builder()
                    .label("Action")
                    .build();

            assertEquals("Action", tag.getLabel());
            assertNull(tag.getId());
        }

        @Test
        @DisplayName("Deve criar tag com id e label via builder")
        void shouldCreateTagWithIdAndLabel() {
            Tag tag = Tag.builder()
                    .id(1L)
                    .label("Romance")
                    .build();

            assertEquals(1L, tag.getId());
            assertEquals("Romance", tag.getLabel());
        }
    }

    @Nested
    @DisplayName("Mutação via setters")
    class MutationTests {

        @Test
        @DisplayName("Deve permitir alterar label via setter")
        void shouldAllowLabelUpdate() {
            Tag tag = Tag.builder()
                    .label("Ação")
                    .build();

            tag.setLabel("Action");
            assertEquals("Action", tag.getLabel());
        }
    }

    @Nested
    @DisplayName("AllArgsConstructor")
    class AllArgsTests {

        @Test
        @DisplayName("Deve criar tag via AllArgsConstructor")
        void shouldCreateViaAllArgs() {
            Tag tag = new Tag(5L, "Fantasy");

            assertEquals(5L, tag.getId());
            assertEquals("Fantasy", tag.getLabel());
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            Tag tag = new Tag();

            assertNull(tag.getId());
            assertNull(tag.getLabel());
        }
    }

    @Nested
    @DisplayName("SortCriteria enum")
    class SortCriteriaTests {

        @Test
        @DisplayName("Deve ter 6 critérios de ordenação")
        void shouldHaveSixSortCriteria() {
            assertEquals(6, SortCriteria.values().length);
        }

        @Test
        @DisplayName("Deve conter todos os critérios esperados")
        void shouldContainExpectedCriteria() {
            SortCriteria[] values = SortCriteria.values();
            assertEquals(SortCriteria.MOST_READ, values[0]);
            assertEquals(SortCriteria.MOST_RATED, values[1]);
            assertEquals(SortCriteria.MOST_RECENT, values[2]);
            assertEquals(SortCriteria.ALPHABETICAL, values[3]);
            assertEquals(SortCriteria.ASCENSION, values[4]);
            assertEquals(SortCriteria.RANDOM, values[5]);
        }

        @Test
        @DisplayName("Deve converter string para enum via valueOf")
        void shouldConvertFromStringViaValueOf() {
            assertEquals(SortCriteria.MOST_READ, SortCriteria.valueOf("MOST_READ"));
            assertEquals(SortCriteria.ALPHABETICAL, SortCriteria.valueOf("ALPHABETICAL"));
        }
    }

    @Nested
    @DisplayName("PublicationStatus enum")
    class PublicationStatusTests {

        @Test
        @DisplayName("Deve ter 5 status de publicação")
        void shouldHaveFiveStatuses() {
            assertEquals(5, PublicationStatus.values().length);
        }

        @Test
        @DisplayName("Deve conter status ALL como filtro geral")
        void shouldContainAllAsGeneralFilter() {
            PublicationStatus all = PublicationStatus.ALL;
            assertEquals("ALL", all.name());
        }

        @Test
        @DisplayName("Deve converter string para enum via valueOf")
        void shouldConvertFromStringViaValueOf() {
            assertEquals(PublicationStatus.COMPLETE, PublicationStatus.valueOf("COMPLETE"));
            assertEquals(PublicationStatus.ONGOING, PublicationStatus.valueOf("ONGOING"));
            assertEquals(PublicationStatus.HIATUS, PublicationStatus.valueOf("HIATUS"));
            assertEquals(PublicationStatus.CANCELLED, PublicationStatus.valueOf("CANCELLED"));
        }
    }
}
