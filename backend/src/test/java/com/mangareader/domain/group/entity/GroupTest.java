package com.mangareader.domain.group.entity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.group.valueobject.GroupStatus;
import com.mangareader.domain.group.valueobject.GroupWorkStatus;
import com.mangareader.domain.user.entity.User;

class GroupTest {

    private User createTestUser(String name) {
        return User.builder()
                .name(name)
                .email(name.toLowerCase() + "@test.com")
                .passwordHash("hash")
                .build();
    }

    @Nested
    @DisplayName("Builder — valores default")
    class BuilderDefaultTests {

        @Test
        @DisplayName("Deve iniciar com defaults corretos no builder")
        void shouldInitializeDefaults() {
            Group group = Group.builder()
                    .name("Scanlation Team")
                    .username("scan-team")
                    .build();

            assertEquals(GroupStatus.ACTIVE, group.getStatus());
            assertEquals(0, group.getTotalTitles());
            assertEquals(0.0, group.getRating());
            assertEquals(0, group.getPopularity());
            assertNotNull(group.getGenres());
            assertTrue(group.getGenres().isEmpty());
            assertNotNull(group.getFocusTags());
            assertTrue(group.getFocusTags().isEmpty());
            assertNotNull(group.getMembers());
            assertTrue(group.getMembers().isEmpty());
            assertNotNull(group.getTranslatedWorks());
            assertTrue(group.getTranslatedWorks().isEmpty());
        }
    }

    @Nested
    @DisplayName("Builder — todos os campos")
    class BuilderAllFieldsTests {

        @Test
        @DisplayName("Deve permitir definir todos os campos via builder")
        void shouldSetAllFieldsViaBuilder() {
            Group group = Group.builder()
                    .name("Alpha Scans")
                    .username("alpha-scans")
                    .logo("https://example.com/logo.png")
                    .banner("https://example.com/banner.png")
                    .description("Grupo de tradução focado em manhwa")
                    .website("https://alphascans.com")
                    .totalTitles(25)
                    .foundedYear(2020)
                    .status(GroupStatus.ACTIVE)
                    .genres(List.of("Action", "Fantasy"))
                    .focusTags(List.of("manhwa", "isekai"))
                    .rating(4.5)
                    .popularity(1000)
                    .build();

            assertEquals("Alpha Scans", group.getName());
            assertEquals("alpha-scans", group.getUsername());
            assertEquals("https://example.com/logo.png", group.getLogo());
            assertEquals("https://example.com/banner.png", group.getBanner());
            assertEquals("Grupo de tradução focado em manhwa", group.getDescription());
            assertEquals("https://alphascans.com", group.getWebsite());
            assertEquals(25, group.getTotalTitles());
            assertEquals(2020, group.getFoundedYear());
            assertEquals(GroupStatus.ACTIVE, group.getStatus());
            assertEquals(2, group.getGenres().size());
            assertEquals(2, group.getFocusTags().size());
            assertEquals(4.5, group.getRating());
            assertEquals(1000, group.getPopularity());
        }
    }

    @Nested
    @DisplayName("Gestão de membros")
    class MemberManagementTests {

        @Test
        @DisplayName("Deve permitir adicionar membro ao grupo")
        void shouldAddMemberToGroup() {
            Group group = Group.builder()
                    .name("Team")
                    .username("team")
                    .build();

            User user = createTestUser("Translator");

            GroupMember member = GroupMember.builder()
                    .group(group)
                    .user(user)
                    .role(GroupRole.TRADUTOR)
                    .build();

            group.getMembers().add(member);

            assertEquals(1, group.getMembers().size());
            assertEquals(GroupRole.TRADUTOR, group.getMembers().getFirst().getRole());
            assertEquals(user, group.getMembers().getFirst().getUser());
        }

        @Test
        @DisplayName("Deve permitir adicionar múltiplos membros com roles diferentes")
        void shouldAddMultipleMembersWithDifferentRoles() {
            Group group = Group.builder()
                    .name("Big Team")
                    .username("big-team")
                    .build();

            GroupMember leader = GroupMember.builder()
                    .group(group)
                    .user(createTestUser("Leader"))
                    .role(GroupRole.LIDER)
                    .build();

            GroupMember translator = GroupMember.builder()
                    .group(group)
                    .user(createTestUser("Translator"))
                    .role(GroupRole.TRADUTOR)
                    .build();

            GroupMember reviewer = GroupMember.builder()
                    .group(group)
                    .user(createTestUser("Reviewer"))
                    .role(GroupRole.REVISOR)
                    .build();

            group.getMembers().addAll(List.of(leader, translator, reviewer));

            assertEquals(3, group.getMembers().size());
        }
    }

    @Nested
    @DisplayName("Gestão de trabalhos traduzidos")
    class WorkManagementTests {

        @Test
        @DisplayName("Deve permitir adicionar trabalho traduzido ao grupo")
        void shouldAddTranslatedWork() {
            Group group = Group.builder()
                    .name("Team")
                    .username("team")
                    .build();

            GroupWork work = GroupWork.builder()
                    .group(group)
                    .titleId("mongo-title-id")
                    .title("Solo Leveling")
                    .cover("https://example.com/sl.jpg")
                    .chapters(150)
                    .status(GroupWorkStatus.ONGOING)
                    .genres(List.of("Action", "Fantasy"))
                    .build();

            group.getTranslatedWorks().add(work);

            assertEquals(1, group.getTranslatedWorks().size());
            assertEquals("Solo Leveling", group.getTranslatedWorks().getFirst().getTitle());
            assertEquals("mongo-title-id", group.getTranslatedWorks().getFirst().getTitleId());
        }
    }

    @Nested
    @DisplayName("Status do grupo")
    class StatusTests {

        @Test
        @DisplayName("Deve permitir mudar status do grupo")
        void shouldChangeGroupStatus() {
            Group group = Group.builder()
                    .name("Team")
                    .username("team")
                    .build();

            assertEquals(GroupStatus.ACTIVE, group.getStatus());

            group.setStatus(GroupStatus.HIATUS);
            assertEquals(GroupStatus.HIATUS, group.getStatus());

            group.setStatus(GroupStatus.INACTIVE);
            assertEquals(GroupStatus.INACTIVE, group.getStatus());
        }
    }

    @Nested
    @DisplayName("GroupRole enum")
    class GroupRoleTests {

        @Test
        @DisplayName("Todos os roles devem ter displayName")
        void allRolesShouldHaveDisplayName() {
            for (GroupRole role : GroupRole.values()) {
                assertNotNull(role.getDisplayName());
                assertFalse(role.getDisplayName().isBlank());
            }
        }

        @Test
        @DisplayName("Deve ter 6 roles disponíveis")
        void shouldHaveExpectedRoleCount() {
            assertEquals(6, GroupRole.values().length);
        }

        @Test
        @DisplayName("LIDER deve ter displayName 'Líder'")
        void liderShouldHaveCorrectDisplayName() {
            assertEquals("Líder", GroupRole.LIDER.getDisplayName());
        }
    }

    @Nested
    @DisplayName("GroupWork defaults")
    class GroupWorkDefaultTests {

        @Test
        @DisplayName("GroupWork deve iniciar com defaults corretos")
        void shouldInitializeWorkDefaults() {
            GroupWork work = GroupWork.builder()
                    .titleId("title-1")
                    .title("Título")
                    .build();

            assertEquals(0, work.getChapters());
            assertEquals(GroupWorkStatus.ONGOING, work.getStatus());
            assertEquals(0, work.getPopularity());
            assertNotNull(work.getGenres());
            assertTrue(work.getGenres().isEmpty());
        }

        @Test
        @DisplayName("Deve permitir marcar trabalho como concluído")
        void shouldMarkWorkAsCompleted() {
            GroupWork work = GroupWork.builder()
                    .titleId("title-1")
                    .title("Naruto")
                    .build();

            assertEquals(GroupWorkStatus.ONGOING, work.getStatus());
            work.setStatus(GroupWorkStatus.COMPLETED);
            assertEquals(GroupWorkStatus.COMPLETED, work.getStatus());
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            Group group = new Group();

            assertNull(group.getId());
            assertNull(group.getName());
            assertNull(group.getUsername());
            assertNull(group.getDescription());
            assertNull(group.getFoundedYear());
            assertNull(group.getPlatformJoinedAt());
        }
    }
}
