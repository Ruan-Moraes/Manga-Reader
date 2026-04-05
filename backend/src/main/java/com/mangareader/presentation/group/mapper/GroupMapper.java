package com.mangareader.presentation.group.mapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

import com.mangareader.domain.group.entity.Group;
import com.mangareader.domain.group.entity.GroupUser;
import com.mangareader.domain.group.entity.GroupWork;
import com.mangareader.domain.group.valueobject.GroupUserType;
import com.mangareader.presentation.group.dto.GroupMemberResponse;
import com.mangareader.presentation.group.dto.GroupPreviewResponse;
import com.mangareader.presentation.group.dto.GroupResponse;
import com.mangareader.presentation.group.dto.GroupSupporterResponse;
import com.mangareader.presentation.group.dto.GroupWorkResponse;

/**
 * Mapper para converter entidades de Group em DTOs de resposta.
 */
public final class GroupMapper {
    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    private GroupMapper() {}

    public static GroupResponse toResponse(Group group) {
        if (group == null) return null;

        var groupUsers = group.getGroupUsers();
        var members = filterByType(groupUsers, GroupUserType.MEMBER);
        var supporters = filterByType(groupUsers, GroupUserType.SUPPORTER);

        return new GroupResponse(
                group.getId().toString(),
                group.getName(),
                group.getUsername(),
                group.getLogo(),
                group.getBanner(),
                group.getDescription(),
                group.getWebsite(),
                group.getTotalTitles(),
                group.getFoundedYear(),
                formatDate(group.getPlatformJoinedAt()),
                group.getStatus().name().toLowerCase(),
                mapMembers(members),
                mapSupporters(supporters),
                group.getGenres(),
                group.getFocusTags(),
                group.getRating(),
                group.getPopularity(),
                mapWorks(group.getTranslatedWorks())
        );
    }

    public static GroupPreviewResponse toPreviewResponse(Group group) {
        if (group == null) return null;

        return new GroupPreviewResponse(
                group.getId() == null ? null : group.getId().toString(),
                group.getName(),
                group.getUsername(),
                group.getLogo(),
                group.getBanner(),
                group.getDescription(),
                group.getWebsite(),
                group.getTotalTitles(),
                group.getFoundedYear(),
                formatDate(group.getPlatformJoinedAt()),
                group.getStatus() == null ? null : group.getStatus().name().toLowerCase(),
                group.getGenres(),
                group.getFocusTags(),
                group.getRating(),
                group.getPopularity()
        );
    }

    private static List<GroupUser> filterByType(List<GroupUser> groupUsers, GroupUserType type) {
        if (groupUsers == null) return Collections.emptyList();

        return groupUsers.stream()
                .filter(gu -> gu.getType() == type)
                .toList();
    }

    private static List<GroupMemberResponse> mapMembers(List<GroupUser> members) {
        if (members == null || members.isEmpty()) return Collections.emptyList();

        return members.stream()
                .map(m -> new GroupMemberResponse(
                        m.getUser().getId().toString(),
                        m.getUser().getName(),
                        m.getUser().getPhotoUrl(),
                        m.getUser().getBio(),
                        m.getRole() != null ? m.getRole().getDisplayName() : null,
                        formatDate(m.getJoinedAt())
                ))
                .toList();
    }

    private static List<GroupSupporterResponse> mapSupporters(List<GroupUser> supporters) {
        if (supporters == null || supporters.isEmpty()) return Collections.emptyList();

        return supporters.stream()
                .map(s -> new GroupSupporterResponse(
                        s.getUser().getId().toString(),
                        s.getUser().getName(),
                        s.getUser().getPhotoUrl(),
                        formatDate(s.getJoinedAt())
                ))
                .toList();
    }

    private static List<GroupWorkResponse> mapWorks(List<GroupWork> works) {
        if (works == null) return Collections.emptyList();

        return works.stream()
                .map(w -> new GroupWorkResponse(
                        w.getId().toString(),
                        w.getTitle(),
                        w.getCover(),
                        w.getChapters(),
                        w.getStatus().name().toLowerCase(),
                        w.getPopularity(),
                        formatDate(w.getUpdatedAt()),
                        w.getGenres()
                ))
                .toList();
    }

    private static String formatDate(LocalDateTime dateTime) {
        if (dateTime == null) return null;

        return dateTime.format(FMT);
    }
}
