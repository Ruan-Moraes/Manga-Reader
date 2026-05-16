package com.mangareader.domain.category.valueobject;

import static org.assertj.core.api.Assertions.assertThat;

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
            assertThat(PublicationStatus.values().length).isEqualTo(5);
        }

        @Test
        @DisplayName("Deve conter todos os status esperados")
        void shouldContainExpectedValues() {
            PublicationStatus[] values = PublicationStatus.values();
            assertThat(values[0]).isEqualTo(PublicationStatus.COMPLETE);
            assertThat(values[1]).isEqualTo(PublicationStatus.ONGOING);
            assertThat(values[2]).isEqualTo(PublicationStatus.HIATUS);
            assertThat(values[3]).isEqualTo(PublicationStatus.CANCELLED);
            assertThat(values[4]).isEqualTo(PublicationStatus.ALL);
        }

        @Test
        @DisplayName("Deve converter de string via valueOf")
        void shouldConvertFromString() {
            assertThat(PublicationStatus.valueOf("ONGOING")).isEqualTo(PublicationStatus.ONGOING);
        }
    }

    @Nested
    @DisplayName("SortCriteria")
    class SortCriteriaTests {

        @Test
        @DisplayName("Deve conter 6 valores")
        void shouldHaveSixValues() {
            assertThat(SortCriteria.values().length).isEqualTo(6);
        }

        @Test
        @DisplayName("Deve conter todos os criterios esperados")
        void shouldContainExpectedValues() {
            SortCriteria[] values = SortCriteria.values();
            assertThat(values[0]).isEqualTo(SortCriteria.MOST_READ);
            assertThat(values[1]).isEqualTo(SortCriteria.MOST_RATED);
            assertThat(values[2]).isEqualTo(SortCriteria.MOST_RECENT);
            assertThat(values[3]).isEqualTo(SortCriteria.ALPHABETICAL);
            assertThat(values[4]).isEqualTo(SortCriteria.ASCENSION);
            assertThat(values[5]).isEqualTo(SortCriteria.RANDOM);
        }

        @Test
        @DisplayName("Deve converter de string via valueOf")
        void shouldConvertFromString() {
            assertThat(SortCriteria.valueOf("ALPHABETICAL")).isEqualTo(SortCriteria.ALPHABETICAL);
        }
    }
}
