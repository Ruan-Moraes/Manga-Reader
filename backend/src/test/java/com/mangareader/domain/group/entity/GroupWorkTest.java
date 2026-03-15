package com.mangareader.domain.group.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.group.valueobject.GroupWorkStatus;

@DisplayName("GroupWork")
class GroupWorkTest {

    @Nested
    @DisplayName("Builder com @Builder.Default")
    class BuilderDefaultTests {

        @Test
        @DisplayName("Deve inicializar chapters=0, status=ONGOING, popularity=0, genres=[] por padrão")
        void shouldInitializeDefaults() {
            GroupWork work = GroupWork.builder()
                    .titleId("mongo-id-123")
                    .title("Solo Leveling")
                    .build();

            assertEquals(0, work.getChapters());
            assertEquals(GroupWorkStatus.ONGOING, work.getStatus());
            assertEquals(0, work.getPopularity());
            assertNotNull(work.getGenres());
            assertTrue(work.getGenres().isEmpty());
        }

        @Test
        @DisplayName("Deve permitir sobrescrever valores default via builder")
        void shouldOverrideDefaults() {
            GroupWork work = GroupWork.builder()
                    .titleId("mongo-id-456")
                    .title("One Piece")
                    .chapters(1100)
                    .status(GroupWorkStatus.COMPLETED)
                    .popularity(999)
                    .genres(List.of("Action", "Adventure"))
                    .build();

            assertEquals(1100, work.getChapters());
            assertEquals(GroupWorkStatus.COMPLETED, work.getStatus());
            assertEquals(999, work.getPopularity());
            assertEquals(2, work.getGenres().size());
            assertTrue(work.getGenres().contains("Action"));
        }
    }

    @Nested
    @DisplayName("Builder com todos os campos")
    class BuilderAllFieldsTests {

        @Test
        @DisplayName("Deve criar instância com todos os campos via builder")
        void shouldBuildWithAllFields() {
            UUID id = UUID.randomUUID();
            Group group = Group.builder().name("Scan BR").build();

            GroupWork work = GroupWork.builder()
                    .id(id)
                    .group(group)
                    .titleId("mongo-789")
                    .title("Naruto")
                    .cover("https://example.com/naruto.jpg")
                    .chapters(700)
                    .status(GroupWorkStatus.COMPLETED)
                    .popularity(500)
                    .genres(List.of("Action", "Shounen"))
                    .build();

            assertEquals(id, work.getId());
            assertEquals(group, work.getGroup());
            assertEquals("mongo-789", work.getTitleId());
            assertEquals("Naruto", work.getTitle());
            assertEquals("https://example.com/naruto.jpg", work.getCover());
            assertEquals(700, work.getChapters());
            assertEquals(GroupWorkStatus.COMPLETED, work.getStatus());
            assertEquals(500, work.getPopularity());
        }
    }

    @Nested
    @DisplayName("NoArgsConstructor")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Deve criar instância vazia — defaults do @Builder.Default não se aplicam")
        void shouldCreateEmptyInstance() {
            GroupWork work = new GroupWork();

            assertNull(work.getId());
            assertNull(work.getGroup());
            assertNull(work.getTitleId());
            assertNull(work.getTitle());
        }
    }
}
