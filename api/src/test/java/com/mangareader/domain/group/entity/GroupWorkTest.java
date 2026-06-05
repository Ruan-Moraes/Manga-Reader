package com.mangareader.domain.group.entity;

import static org.assertj.core.api.Assertions.assertThat;

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

            assertThat(work.getChapters()).isEqualTo(0);
            assertThat(work.getStatus()).isEqualTo(GroupWorkStatus.ONGOING);
            assertThat(work.getPopularity()).isEqualTo(0);
            assertThat(work.getGenres()).isNotNull();
            assertThat(work.getGenres().isEmpty()).isTrue();
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

            assertThat(work.getChapters()).isEqualTo(1100);
            assertThat(work.getStatus()).isEqualTo(GroupWorkStatus.COMPLETED);
            assertThat(work.getPopularity()).isEqualTo(999);
            assertThat(work.getGenres().size()).isEqualTo(2);
            assertThat(work.getGenres().contains("Action")).isTrue();
        }
    }

    @Nested
    @DisplayName("Builder com todos os campos")
    class BuilderAllFieldsTests {

        @Test
        @DisplayName("Deve criar instância com todos os campos via builder")
        void shouldBuildWithAllFields() {
            UUID id = UUID.randomUUID();
            Group group = Group.builder().name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Scan BR")).build();

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

            assertThat(work.getId()).isEqualTo(id);
            assertThat(work.getGroup()).isEqualTo(group);
            assertThat(work.getTitleId()).isEqualTo("mongo-789");
            assertThat(work.getTitle()).isEqualTo("Naruto");
            assertThat(work.getCover()).isEqualTo("https://example.com/naruto.jpg");
            assertThat(work.getChapters()).isEqualTo(700);
            assertThat(work.getStatus()).isEqualTo(GroupWorkStatus.COMPLETED);
            assertThat(work.getPopularity()).isEqualTo(500);
        }
    }

    @Nested
    @DisplayName("NoArgsConstructor")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Deve criar instância vazia — defaults do @Builder.Default não se aplicam")
        void shouldCreateEmptyInstance() {
            GroupWork work = new GroupWork();

            assertThat(work.getId()).isNull();
            assertThat(work.getGroup()).isNull();
            assertThat(work.getTitleId()).isNull();
            assertThat(work.getTitle()).isNull();
        }
    }
}
