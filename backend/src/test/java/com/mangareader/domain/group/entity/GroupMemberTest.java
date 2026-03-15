package com.mangareader.domain.group.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.user.entity.User;

@DisplayName("GroupMember")
class GroupMemberTest {

    @Nested
    @DisplayName("Builder")
    class BuilderTests {

        @Test
        @DisplayName("Deve criar instância com todos os campos via builder")
        void shouldBuildWithAllFields() {
            UUID id = UUID.randomUUID();
            Group group = Group.builder().name("Scan Group").build();
            User user = User.builder().name("Ruan").email("ruan@test.com").build();
            LocalDateTime joinedAt = LocalDateTime.now();

            GroupMember member = GroupMember.builder()
                    .id(id)
                    .group(group)
                    .user(user)
                    .role(GroupRole.LIDER)
                    .joinedAt(joinedAt)
                    .build();

            assertEquals(id, member.getId());
            assertEquals(group, member.getGroup());
            assertEquals(user, member.getUser());
            assertEquals(GroupRole.LIDER, member.getRole());
            assertEquals(joinedAt, member.getJoinedAt());
        }

        @Test
        @DisplayName("Deve permitir definir diferentes roles")
        void shouldAllowDifferentRoles() {
            GroupMember tradutor = GroupMember.builder().role(GroupRole.TRADUTOR).build();
            GroupMember cleaner = GroupMember.builder().role(GroupRole.CLEANER).build();

            assertEquals(GroupRole.TRADUTOR, tradutor.getRole());
            assertEquals(GroupRole.CLEANER, cleaner.getRole());
        }
    }

    @Nested
    @DisplayName("NoArgsConstructor")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Deve criar instância vazia com construtor padrão")
        void shouldCreateEmptyInstance() {
            GroupMember member = new GroupMember();

            assertNull(member.getId());
            assertNull(member.getGroup());
            assertNull(member.getUser());
            assertNull(member.getRole());
            assertNull(member.getJoinedAt());
        }
    }

    @Nested
    @DisplayName("Getters e Setters")
    class GetterSetterTests {

        @Test
        @DisplayName("Deve atualizar role via setter")
        void shouldUpdateRoleViaSetter() {
            GroupMember member = GroupMember.builder().role(GroupRole.TRADUTOR).build();
            member.setRole(GroupRole.REVISOR);

            assertEquals(GroupRole.REVISOR, member.getRole());
        }
    }
}
