package com.mangareader.mock.group;

import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupMember;
import com.mangareader.domain.group.entity.GroupWork;
import com.mangareader.domain.group.valueobject.GroupRole;
import com.mangareader.domain.group.valueobject.GroupStatus;
import com.mangareader.domain.group.valueobject.GroupWorkStatus;
import com.mangareader.domain.user.entity.User;
import com.mangareader.mock.title.TitleMock;
import com.mangareader.mock.user.UserMock;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class GroupMock {

    private GroupMock() {}

    // ── Fixed IDs ──────────────────────────────────────────────────────────

    public static final UUID GROUP_1_ID = UUID.fromString("10000000-0000-0000-0000-000000000001");
    public static final UUID GROUP_2_ID = UUID.fromString("10000000-0000-0000-0000-000000000002");
    public static final UUID GROUP_3_ID = UUID.fromString("10000000-0000-0000-0000-000000000003");

    // ── Groups ─────────────────────────────────────────────────────────────

    public static Group activeGroup() {
        Group group = Group.builder()
                .id(GROUP_1_ID)
                .name("Scan Revolution")
                .username("scan-revolution")
                .logo("https://picsum.photos/100/100?random=g1")
                .banner("https://picsum.photos/800/200?random=g1")
                .description("Grupo focado em traduzir mangás de ação e aventura para português.")
                .website("https://scanrevolution.com")
                .totalTitles(5)
                .foundedYear(2020)
                .status(GroupStatus.ACTIVE)
                .genres(new ArrayList<>(List.of("Acao", "Aventura", "Fantasia")))
                .focusTags(new ArrayList<>(List.of("Shonen", "Seinen")))
                .rating(4.5)
                .popularity(850)
                .members(new ArrayList<>())
                .translatedWorks(new ArrayList<>())
                .build();

        group.getMembers().add(leader(group, UserMock.admin()));
        group.getMembers().add(translator(group, UserMock.poster()));
        group.getMembers().add(member(group, UserMock.reader()));

        group.getTranslatedWorks().add(ongoingWork(group));
        group.getTranslatedWorks().add(completedWork(group));

        return group;
    }

    public static Group inactiveGroup() {
        return Group.builder()
                .id(GROUP_2_ID)
                .name("Old Scans")
                .username("old-scans")
                .description("Grupo inativo desde 2023.")
                .totalTitles(2)
                .foundedYear(2018)
                .status(GroupStatus.INACTIVE)
                .genres(new ArrayList<>(List.of("Romance")))
                .focusTags(new ArrayList<>())
                .rating(3.0)
                .popularity(120)
                .members(new ArrayList<>())
                .translatedWorks(new ArrayList<>())
                .build();
    }

    public static Group hiatusGroup() {
        return Group.builder()
                .id(GROUP_3_ID)
                .name("Paused Translations")
                .username("paused-translations")
                .description("Em hiato temporário por falta de membros.")
                .totalTitles(3)
                .foundedYear(2021)
                .status(GroupStatus.HIATUS)
                .genres(new ArrayList<>(List.of("Drama", "Slice of Life")))
                .focusTags(new ArrayList<>(List.of("Josei")))
                .rating(4.0)
                .popularity(300)
                .members(new ArrayList<>())
                .translatedWorks(new ArrayList<>())
                .build();
    }

    public static Group emptyGroup() {
        return Group.builder()
                .id(UUID.randomUUID())
                .name("Novo Grupo")
                .username("novo-grupo")
                .status(GroupStatus.ACTIVE)
                .members(new ArrayList<>())
                .translatedWorks(new ArrayList<>())
                .genres(new ArrayList<>())
                .focusTags(new ArrayList<>())
                .build();
    }

    // ── Members ────────────────────────────────────────────────────────────

    public static GroupMember leader(Group group, User user) {
        return GroupMember.builder()
                .id(UUID.randomUUID())
                .group(group)
                .user(user)
                .role(GroupRole.LIDER)
                .build();
    }

    public static GroupMember translator(Group group, User user) {
        return GroupMember.builder()
                .id(UUID.randomUUID())
                .group(group)
                .user(user)
                .role(GroupRole.TRADUTOR)
                .build();
    }

    public static GroupMember moderatorMember(Group group, User user) {
        return GroupMember.builder()
                .id(UUID.randomUUID())
                .group(group)
                .user(user)
                .role(GroupRole.QC)
                .build();
    }

    public static GroupMember member(Group group, User user) {
        return GroupMember.builder()
                .id(UUID.randomUUID())
                .group(group)
                .user(user)
                .role(GroupRole.REVISOR)
                .build();
    }

    // ── Works ──────────────────────────────────────────────────────────────

    public static GroupWork ongoingWork(Group group) {
        return GroupWork.builder()
                .id(UUID.randomUUID())
                .group(group)
                .titleId(TitleMock.TITLE_1_ID)
                .title("Reino de Aco")
                .cover("https://picsum.photos/300/450?random=101")
                .chapters(8)
                .status(GroupWorkStatus.ONGOING)
                .popularity(200)
                .genres(new ArrayList<>(List.of("Acao", "Fantasia")))
                .build();
    }

    public static GroupWork completedWork(Group group) {
        return GroupWork.builder()
                .id(UUID.randomUUID())
                .group(group)
                .titleId(TitleMock.TITLE_4_ID)
                .title("Cronicas de Polaris")
                .cover("https://picsum.photos/300/450?random=104")
                .chapters(20)
                .status(GroupWorkStatus.COMPLETED)
                .popularity(500)
                .genres(new ArrayList<>(List.of("Aventura", "Misterio")))
                .build();
    }

    // ── Collections ────────────────────────────────────────────────────────

    public static List<Group> allGroups() {
        return List.of(activeGroup(), inactiveGroup(), hiatusGroup());
    }

    public static List<Group> activeGroups() {
        return List.of(activeGroup());
    }
}
