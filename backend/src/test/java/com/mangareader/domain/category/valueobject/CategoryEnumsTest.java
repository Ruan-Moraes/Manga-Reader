package com.mangareader.domain.category.valueobject;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("Enums de Category")
class CategoryEnumsTest {

    @Nested
    @DisplayName("PublicationStatus")
    class PublicationStatusTests {

        @Test
        @DisplayName("Deve conter 5 valores")
        void shouldHaveFiveValues() {
            assertEquals(5, PublicationStatus.values().length);
        }

        @Test
        @DisplayName("Deve conter todos os status esperados")
        void shouldContainExpectedValues() {
            PublicationStatus[] values = PublicationStatus.values();
            assertEquals(PublicationStatus.COMPLETE, values[0]);
            assertEquals(PublicationStatus.ONGOING, values[1]);
            assertEquals(PublicationStatus.HIATUS, values[2]);
            assertEquals(PublicationStatus.CANCELLED, values[3]);
            assertEquals(PublicationStatus.ALL, values[4]);
        }

        @Test
        @DisplayName("Deve converter de string via valueOf")
        void shouldConvertFromString() {
            assertEquals(PublicationStatus.ONGOING, PublicationStatus.valueOf("ONGOING"));
        }
    }

    @Nested
    @DisplayName("SortCriteria")
    class SortCriteriaTests {

        @Test
        @DisplayName("Deve conter 6 valores")
        void shouldHaveSixValues() {
            assertEquals(6, SortCriteria.values().length);
        }

        @Test
        @DisplayName("Deve conter todos os criterios esperados")
        void shouldContainExpectedValues() {
            SortCriteria[] values = SortCriteria.values();
            assertEquals(SortCriteria.MOST_READ, values[0]);
            assertEquals(SortCriteria.MOST_RATED, values[1]);
            assertEquals(SortCriteria.MOST_RECENT, values[2]);
            assertEquals(SortCriteria.ALPHABETICAL, values[3]);
            assertEquals(SortCriteria.ASCENSION, values[4]);
            assertEquals(SortCriteria.RANDOM, values[5]);
        }

        @Test
        @DisplayName("Deve converter de string via valueOf")
        void shouldConvertFromString() {
            assertEquals(SortCriteria.ALPHABETICAL, SortCriteria.valueOf("ALPHABETICAL"));
        }
    }
}
