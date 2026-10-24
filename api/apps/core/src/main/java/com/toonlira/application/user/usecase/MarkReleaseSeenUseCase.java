package com.toonlira.application.user.usecase;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.manga.port.ReleaseFeedQueryPort;
import com.toonlira.application.manga.service.AdultContentAccessPolicy;
import com.toonlira.application.manga.usecase.GetReleaseFeedUseCase;
import com.toonlira.application.user.port.ReleaseFeedViewRepositoryPort;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional("mongoTransactionManager")
public class MarkReleaseSeenUseCase {
    private final ReleaseFeedQueryPort releases;
    private final ReleaseFeedViewRepositoryPort views;
    private final AdultContentAccessPolicy adultPolicy;
    private final Clock clock;

    public void markChapter(UUID userId, String chapterId) {
        boolean excludeAdult = adultPolicy.mustExcludeAdult(userId);
        if (!releases.isPublicChapter(chapterId, clock.instant(), excludeAdult)) {
            throw new ResourceNotFoundException("Chapter", "id", chapterId);
        }
        views.markSeen(userId.toString(), chapterId, clock.instant());
    }

    public long markDay(UUID userId, LocalDate date, String timeZone) {
        ZoneId zone = GetReleaseFeedUseCase.parseZone(timeZone);
        var from = date.atStartOfDay(zone).toInstant();
        var to = date.plusDays(1).atStartOfDay(zone).toInstant().minusNanos(1);
        var chapterIds = releases.findPublicChapterIds(from, to, adultPolicy.mustExcludeAdult(userId));
        return views.markSeen(userId.toString(), chapterIds, clock.instant());
    }
}
