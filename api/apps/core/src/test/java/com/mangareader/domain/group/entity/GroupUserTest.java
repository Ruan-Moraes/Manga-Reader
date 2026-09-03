package com.mangareader.domain.group.entity;

import static org.assertj.core.api.Assertions.assertThat;

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
            Group group = Group.builder().name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Scan Group")).build();
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

            assertThat(groupUser.getId()).isEqualTo(id);
            assertThat(groupUser.getGroup()).isEqualTo(group);
            assertThat(groupUser.getUser()).isEqualTo(user);
            assertThat(groupUser.getType()).isEqualTo(GroupUserType.MEMBER);
            assertThat(groupUser.getRole()).isEqualTo(GroupRole.LIDER);
            assertThat(groupUser.getJoinedAt()).isEqualTo(joinedAt);
        }

        @Test
        @DisplayName("Deve inicializar type com MEMBER via @Builder.Default")
        void shouldDefaultTypeToMember() {
            GroupUser groupUser = GroupUser.builder().build();

            assertThat(groupUser.getType()).isEqualTo(GroupUserType.MEMBER);
        }

        @Test
        @DisplayName("Deve permitir definir diferentes roles")
        void shouldAllowDifferentRoles() {
            GroupUser tradutor = GroupUser.builder().role(GroupRole.TRADUTOR).build();
            GroupUser cleaner = GroupUser.builder().role(GroupRole.CLEANER).build();

            assertThat(tradutor.getRole()).isEqualTo(GroupRole.TRADUTOR);
            assertThat(cleaner.getRole()).isEqualTo(GroupRole.CLEANER);
        }

        @Test
        @DisplayName("Deve permitir role null para supporter")
        void shouldAllowNullRoleForSupporter() {
            GroupUser supporter = GroupUser.builder()
                    .type(GroupUserType.SUPPORTER)
                    .role(null)
                    .build();

            assertThat(supporter.getType()).isEqualTo(GroupUserType.SUPPORTER);
            assertThat(supporter.getRole()).isNull();
        }
    }

    @Nested
    @DisplayName("NoArgsConstructor")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Deve criar instância vazia com construtor padrão")
        void shouldCreateEmptyInstance() {
            GroupUser groupUser = new GroupUser();

            assertThat(groupUser.getId()).isNull();
            assertThat(groupUser.getGroup()).isNull();
            assertThat(groupUser.getUser()).isNull();
            assertThat(groupUser.getRole()).isNull();
            assertThat(groupUser.getJoinedAt()).isNull();
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

            assertThat(groupUser.getRole()).isEqualTo(GroupRole.REVISOR);
        }
    }
}
