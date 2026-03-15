package com.mangareader.domain.group.valueobject;

import static org.junit.jupiter.api.Assertions.assertEquals;

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
            assertEquals(6, GroupRole.values().length);
        }

        @Test
        @DisplayName("Deve retornar displayName correto para cada role")
        void shouldReturnCorrectDisplayNames() {
            assertEquals("Líder", GroupRole.LIDER.getDisplayName());
            assertEquals("Tradutor(a)", GroupRole.TRADUTOR.getDisplayName());
            assertEquals("Revisor(a)", GroupRole.REVISOR.getDisplayName());
            assertEquals("QC", GroupRole.QC.getDisplayName());
            assertEquals("Cleaner", GroupRole.CLEANER.getDisplayName());
            assertEquals("Typesetter", GroupRole.TYPESETTER.getDisplayName());
        }
    }

    @Nested
    @DisplayName("GroupStatus")
    class GroupStatusTests {

        @Test
        @DisplayName("Deve conter 3 valores")
        void shouldHaveThreeValues() {
            assertEquals(3, GroupStatus.values().length);
        }

        @Test
        @DisplayName("Deve conter todos os status esperados")
        void shouldContainExpectedValues() {
            GroupStatus[] values = GroupStatus.values();
            assertEquals(GroupStatus.ACTIVE, values[0]);
            assertEquals(GroupStatus.INACTIVE, values[1]);
            assertEquals(GroupStatus.HIATUS, values[2]);
        }
    }

    @Nested
    @DisplayName("GroupWorkStatus")
    class GroupWorkStatusTests {

        @Test
        @DisplayName("Deve conter 2 valores")
        void shouldHaveTwoValues() {
            assertEquals(2, GroupWorkStatus.values().length);
        }

        @Test
        @DisplayName("Deve conter ONGOING e COMPLETED")
        void shouldContainExpectedValues() {
            assertEquals(GroupWorkStatus.ONGOING, GroupWorkStatus.values()[0]);
            assertEquals(GroupWorkStatus.COMPLETED, GroupWorkStatus.values()[1]);
        }
    }
}
