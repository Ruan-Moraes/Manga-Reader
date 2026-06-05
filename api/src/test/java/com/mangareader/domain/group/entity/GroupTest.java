package com.mangareader.domain.group.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.group.valueobject.GroupStatus;
import com.mangareader.domain.group.valueobject.GroupUserType;
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
                    .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Scanlation Team"))
                    .username("scan-team")
                    .build();

            assertThat(group.getStatus()).isEqualTo(GroupStatus.ACTIVE);
            assertThat(group.getTotalTitles()).isEqualTo(0);
            assertThat(group.getRating()).isEqualTo(0.0);
            assertThat(group.getPopularity()).isEqualTo(0);
            assertThat(group.getGenres()).isNotNull();
            assertThat(group.getGenres().isEmpty()).isTrue();
            assertThat(group.getFocusTags()).isNotNull();
            assertThat(group.getFocusTags().isEmpty()).isTrue();
            assertThat(group.getGroupUsers()).isNotNull();
            assertThat(group.getGroupUsers().isEmpty()).isTrue();
            assertThat(group.getTranslatedWorks()).isNotNull();
            assertThat(group.getTranslatedWorks().isEmpty()).isTrue();
        }
    }

    @Nested
    @DisplayName("Builder — todos os campos")
    class BuilderAllFieldsTests {

        @Test
        @DisplayName("Deve permitir definir todos os campos via builder")
        void shouldSetAllFieldsViaBuilder() {
            Group group = Group.builder()
                    .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Alpha Scans"))
                    .username("alpha-scans")
                    .logo("https://example.com/logo.png")
                    .banner("https://example.com/banner.png")
                    .description(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Grupo de tradução focado em manhwa"))
                    .website("https://alphascans.com")
                    .totalTitles(25)
                    .foundedYear(2020)
                    .status(GroupStatus.ACTIVE)
                    .genres(List.of("Action", "Fantasy"))
                    .focusTags(List.of("manhwa", "isekai"))
                    .rating(4.5)
                    .popularity(1000)
                    .build();

            assertThat(group.getName().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("Alpha Scans");
            assertThat(group.getUsername()).isEqualTo("alpha-scans");
            assertThat(group.getLogo()).isEqualTo("https://example.com/logo.png");
            assertThat(group.getBanner()).isEqualTo("https://example.com/banner.png");
            assertThat(group.getDescription().resolve(java.util.Locale.forLanguageTag("pt-BR"))).isEqualTo("Grupo de tradução focado em manhwa");
            assertThat(group.getWebsite()).isEqualTo("https://alphascans.com");
            assertThat(group.getTotalTitles()).isEqualTo(25);
            assertThat(group.getFoundedYear()).isEqualTo(2020);
            assertThat(group.getStatus()).isEqualTo(GroupStatus.ACTIVE);
            assertThat(group.getGenres().size()).isEqualTo(2);
            assertThat(group.getFocusTags().size()).isEqualTo(2);
            assertThat(group.getRating()).isEqualTo(4.5);
            assertThat(group.getPopularity()).isEqualTo(1000);
        }
    }

    @Nested
    @DisplayName("Gestão de usuários do grupo")
    class GroupUserManagementTests {

        @Test
        @DisplayName("Deve permitir adicionar membro ao grupo")
        void shouldAddMemberToGroup() {
            Group group = Group.builder()
                    .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Team"))
                    .username("team")
                    .build();

            User user = createTestUser("Translator");

            GroupUser groupUser = GroupUser.builder()
                    .group(group)
                    .user(user)
                    .type(GroupUserType.MEMBER)
                    .role(GroupRole.TRADUTOR)
                    .build();

            group.getGroupUsers().add(groupUser);

            assertThat(group.getGroupUsers().size()).isEqualTo(1);
            assertThat(group.getGroupUsers().getFirst().getRole()).isEqualTo(GroupRole.TRADUTOR);
            assertThat(group.getGroupUsers().getFirst().getUser()).isEqualTo(user);
        }

        @Test
        @DisplayName("Deve permitir adicionar múltiplos membros com roles diferentes")
        void shouldAddMultipleMembersWithDifferentRoles() {
            Group group = Group.builder()
                    .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Big Team"))
                    .username("big-team")
                    .build();

            GroupUser leader = GroupUser.builder()
                    .group(group)
                    .user(createTestUser("Leader"))
                    .type(GroupUserType.MEMBER)
                    .role(GroupRole.LIDER)
                    .build();

            GroupUser translator = GroupUser.builder()
                    .group(group)
                    .user(createTestUser("Translator"))
                    .type(GroupUserType.MEMBER)
                    .role(GroupRole.TRADUTOR)
                    .build();

            GroupUser reviewer = GroupUser.builder()
                    .group(group)
                    .user(createTestUser("Reviewer"))
                    .type(GroupUserType.MEMBER)
                    .role(GroupRole.REVISOR)
                    .build();

            group.getGroupUsers().addAll(List.of(leader, translator, reviewer));

            assertThat(group.getGroupUsers().size()).isEqualTo(3);
        }

        @Test
        @DisplayName("Deve permitir adicionar supporter ao grupo")
        void shouldAddSupporterToGroup() {
            Group group = Group.builder()
                    .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Team"))
                    .username("team")
                    .build();

            User user = createTestUser("Supporter");

            GroupUser supporter = GroupUser.builder()
                    .group(group)
                    .user(user)
                    .type(GroupUserType.SUPPORTER)
                    .build();

            group.getGroupUsers().add(supporter);

            assertThat(group.getGroupUsers().size()).isEqualTo(1);
            assertThat(group.getGroupUsers().getFirst().getType()).isEqualTo(GroupUserType.SUPPORTER);
            assertThat(group.getGroupUsers().getFirst().getRole()).isNull();
        }
    }

    @Nested
    @DisplayName("Gestão de trabalhos traduzidos")
    class WorkManagementTests {

        @Test
        @DisplayName("Deve permitir adicionar trabalho traduzido ao grupo")
        void shouldAddTranslatedWork() {
            Group group = Group.builder()
                    .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Team"))
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

            assertThat(group.getTranslatedWorks().size()).isEqualTo(1);
            assertThat(group.getTranslatedWorks().getFirst().getTitle()).isEqualTo("Solo Leveling");
            assertThat(group.getTranslatedWorks().getFirst().getTitleId()).isEqualTo("mongo-title-id");
        }
    }

    @Nested
    @DisplayName("Status do grupo")
    class StatusTests {

        @Test
        @DisplayName("Deve permitir mudar status do grupo")
        void shouldChangeGroupStatus() {
            Group group = Group.builder()
                    .name(com.mangareader.shared.domain.i18n.LocalizedString.ofDefault("Team"))
                    .username("team")
                    .build();

            assertThat(group.getStatus()).isEqualTo(GroupStatus.ACTIVE);

            group.setStatus(GroupStatus.HIATUS);
            assertThat(group.getStatus()).isEqualTo(GroupStatus.HIATUS);

            group.setStatus(GroupStatus.INACTIVE);
            assertThat(group.getStatus()).isEqualTo(GroupStatus.INACTIVE);
        }
    }

    @Nested
    @DisplayName("GroupRole enum")
    class GroupRoleTests {

        @Test
        @DisplayName("Todos os roles devem ter displayName")
        void allRolesShouldHaveDisplayName() {
            for (GroupRole role : GroupRole.values()) {
                assertThat(role.getDisplayName()).isNotNull();
                assertThat(role.getDisplayName().isBlank()).isFalse();
            }
        }

        @Test
        @DisplayName("Deve ter 6 roles disponíveis")
        void shouldHaveExpectedRoleCount() {
            assertThat(GroupRole.values().length).isEqualTo(6);
        }

        @Test
        @DisplayName("LIDER deve ter displayName 'Líder'")
        void liderShouldHaveCorrectDisplayName() {
            assertThat(GroupRole.LIDER.getDisplayName()).isEqualTo("Líder");
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

            assertThat(work.getChapters()).isEqualTo(0);
            assertThat(work.getStatus()).isEqualTo(GroupWorkStatus.ONGOING);
            assertThat(work.getPopularity()).isEqualTo(0);
            assertThat(work.getGenres()).isNotNull();
            assertThat(work.getGenres().isEmpty()).isTrue();
        }

        @Test
        @DisplayName("Deve permitir marcar trabalho como concluído")
        void shouldMarkWorkAsCompleted() {
            GroupWork work = GroupWork.builder()
                    .titleId("title-1")
                    .title("Naruto")
                    .build();

            assertThat(work.getStatus()).isEqualTo(GroupWorkStatus.ONGOING);
            work.setStatus(GroupWorkStatus.COMPLETED);
            assertThat(work.getStatus()).isEqualTo(GroupWorkStatus.COMPLETED);
        }
    }

    @Nested
    @DisplayName("Construtor vazio")
    class NoArgsConstructorTests {

        @Test
        @DisplayName("Construtor vazio deve manter campos nulos")
        void shouldKeepFieldsNullOnNoArgsConstructor() {
            Group group = new Group();

            assertThat(group.getId()).isNull();
            assertThat(group.getName().isEmpty()).isTrue();
            assertThat(group.getUsername()).isNull();
            assertThat(group.getDescription().isEmpty()).isTrue();
            assertThat(group.getFoundedYear()).isNull();
            assertThat(group.getPlatformJoinedAt()).isNull();
        }
    }
}
