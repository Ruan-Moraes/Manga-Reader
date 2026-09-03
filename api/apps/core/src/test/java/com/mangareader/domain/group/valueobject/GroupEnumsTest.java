package com.mangareader.domain.group.valueobject;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

@DisplayName("Enums de Group")
class GroupEnumsTest {

    @Nested
    @DisplayName("GroupRole")
    class GroupRoleTests {

        @Test
        @DisplayName("Deve conter 6 valores")
        void shouldHaveSixValues() {
            assertThat(GroupRole.values().length).isEqualTo(6);
        }

        @Test
        @DisplayName("Deve retornar displayName correto para cada role")
        void shouldReturnCorrectDisplayNames() {
            assertThat(GroupRole.LIDER.getDisplayName()).isEqualTo("Líder");
            assertThat(GroupRole.TRADUTOR.getDisplayName()).isEqualTo("Tradutor(a)");
            assertThat(GroupRole.REVISOR.getDisplayName()).isEqualTo("Revisor(a)");
            assertThat(GroupRole.QC.getDisplayName()).isEqualTo("QC");
            assertThat(GroupRole.CLEANER.getDisplayName()).isEqualTo("Cleaner");
            assertThat(GroupRole.TYPESETTER.getDisplayName()).isEqualTo("Typesetter");
        }
    }

    @Nested
    @DisplayName("GroupStatus")
    class GroupStatusTests {

        @Test
        @DisplayName("Deve conter 3 valores")
        void shouldHaveThreeValues() {
            assertThat(GroupStatus.values().length).isEqualTo(3);
        }

        @Test
        @DisplayName("Deve conter todos os status esperados")
        void shouldContainExpectedValues() {
            GroupStatus[] values = GroupStatus.values();
            assertThat(values[0]).isEqualTo(GroupStatus.ACTIVE);
            assertThat(values[1]).isEqualTo(GroupStatus.INACTIVE);
            assertThat(values[2]).isEqualTo(GroupStatus.HIATUS);
        }
    }

    @Nested
    @DisplayName("GroupWorkStatus")
    class GroupWorkStatusTests {

        @Test
        @DisplayName("Deve conter 2 valores")
        void shouldHaveTwoValues() {
            assertThat(GroupWorkStatus.values().length).isEqualTo(2);
        }

        @Test
        @DisplayName("Deve conter ONGOING e COMPLETED")
        void shouldContainExpectedValues() {
            assertThat(GroupWorkStatus.values()[0]).isEqualTo(GroupWorkStatus.ONGOING);
            assertThat(GroupWorkStatus.values()[1]).isEqualTo(GroupWorkStatus.COMPLETED);
        }
    }

    @Nested
    @DisplayName("GroupUserType")
    class GroupUserTypeTests {

        @Test
        @DisplayName("Deve conter 2 valores")
        void shouldHaveTwoValues() {
            assertThat(GroupUserType.values().length).isEqualTo(2);
        }

        @Test
        @DisplayName("Deve conter MEMBER e SUPPORTER")
        void shouldContainExpectedValues() {
            assertThat(GroupUserType.values()[0]).isEqualTo(GroupUserType.MEMBER);
            assertThat(GroupUserType.values()[1]).isEqualTo(GroupUserType.SUPPORTER);
        }
    }
}
