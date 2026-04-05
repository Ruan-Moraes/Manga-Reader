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
import com.mangareader.domain.group.valueobject.GroupUserType;
import com.mangareader.domain.user.entity.User;

@DisplayName("GroupUser")
class GroupUserTest {

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

            GroupUser groupUser = GroupUser.builder()
                    .id(id)
                    .group(group)
                    .user(user)
                    .type(GroupUserType.MEMBER)
                    .role(GroupRole.LIDER)
                    .joinedAt(joinedAt)
                    .build();

            assertEquals(id, groupUser.getId());
            assertEquals(group, groupUser.getGroup());
            assertEquals(user, groupUser.getUser());
            assertEquals(GroupUserType.MEMBER, groupUser.getType());
            assertEquals(GroupRole.LIDER, groupUser.getRole());
            assertEquals(joinedAt, groupUser.getJoinedAt());
        }

        @Test
        @DisplayName("Deve inicializar type com MEMBER via @Builder.Default")
        void shouldDefaultTypeToMember() {
            GroupUser groupUser = GroupUser.builder().build();

            assertEquals(GroupUserType.MEMBER, groupUser.getType());
        }

        @Test
        @DisplayName("Deve permitir definir diferentes roles")
        void shouldAllowDifferentRoles() {
            GroupUser tradutor = GroupUser.builder().role(GroupRole.TRADUTOR).build();
            GroupUser cleaner = GroupUser.builder().role(GroupRole.CLEANER).build();

            assertEquals(GroupRole.TRADUTOR, tradutor.getRole());
            assertEquals(GroupRole.CLEANER, cleaner.getRole());
        }

        @Test
        @DisplayName("Deve permitir role null para supporter")
        void shouldAllowNullRoleForSupporter() {
            GroupUser supporter = GroupUser.builder()
                    .type(GroupUserType.SUPPORTER)
                    .role(null)
                    .build();

            assertEquals(GroupUserType.SUPPORTER, supporter.getType());
            assertNull(supporter.getRole());
        }
    }

    @Nested
    @DisplayName("NoArgsConstructor")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Deve criar instância vazia com construtor padrão")
        void shouldCreateEmptyInstance() {
            GroupUser groupUser = new GroupUser();

            assertNull(groupUser.getId());
            assertNull(groupUser.getGroup());
            assertNull(groupUser.getUser());
            assertNull(groupUser.getRole());
            assertNull(groupUser.getJoinedAt());
        }
    }

    @Nested
    @DisplayName("Getters e Setters")
    class GetterSetterTests {

        @Test
        @DisplayName("Deve atualizar role via setter")
        void shouldUpdateRoleViaSetter() {
            GroupUser groupUser = GroupUser.builder().role(GroupRole.TRADUTOR).build();
            groupUser.setRole(GroupRole.REVISOR);

            assertEquals(GroupRole.REVISOR, groupUser.getRole());
        }
    }
}
