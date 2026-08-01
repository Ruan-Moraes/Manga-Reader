package com.mangareader.application.manga.usecase;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.application.manga.port.ReleaseFeedQueryPort;
import com.mangareader.application.manga.service.AdultContentAccessPolicy;
import com.mangareader.application.user.port.ReleaseFeedViewRepositoryPort;
import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.domain.manga.valueobject.ReleasePeriod;
import com.mangareader.shared.application.i18n.LocaleResolutionService;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.exception.BusinessRuleException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GetReleaseFeedUseCase {
    private final ReleaseFeedQueryPort releases;
    private final ReleaseFeedViewRepositoryPort views;
    private final LibraryRepositoryPort library;
    private final AdultContentAccessPolicy adultPolicy;
    private final LocaleResolutionService locale;
    private final Clock clock;

    public record Request(String query, String language, ReleasePeriod period, boolean libraryOnly,
            String timeZone, UUID userId, Pageable pageable) {}
    public record Item(String chapterId, String titleId, String titleName, String titleCover,
            String chapterNumber, String chapterTitle, Instant publishedAt, String contentLanguage,
            String scanGroupId, String scanGroupName, String scanGroupLogo, boolean seen) {}
    public record Result(Page<Item> releases, List<String> availableLanguages) {}

    public Result execute(Request request) {
        ZoneId zone = parseZone(request.timeZone());
        ReleasePeriod period = request.period() == null ? ReleasePeriod.WEEK : request.period();
        Instant to = clock.instant();
        Instant from = LocalDate.now(clock.withZone(zone))
                .minusDays(period.calendarDays() - 1L)
                .atStartOfDay(zone).toInstant();
        Collection<String> restrictIds = libraryRestriction(request.libraryOnly(), request.userId());
        boolean excludeAdult = adultPolicy.mustExcludeAdult(request.userId());
        var page = releases.find(new ReleaseFeedQueryPort.Query(from, to, request.query(),
                request.language(), restrictIds, excludeAdult), request.pageable());
        Set<String> seen = request.userId() == null ? Set.of() : views.findSeenChapterIds(
                request.userId().toString(), page.getContent().stream()
                        .map(ReleaseFeedQueryPort.Item::chapterId).toList());
        Page<Item> mapped = page.map(item -> new Item(
                item.chapterId(), item.titleId(),
                locale.resolve(LocalizedString.of(item.titleNames())),
                item.titleCover(), item.chapterNumber(),
                locale.resolve(LocalizedString.of(item.chapterTitles())),
                item.publishedAt(), item.contentLanguage(), item.scanGroupId(),
                item.scanGroupNames().isEmpty() ? null
                        : locale.resolve(LocalizedString.of(item.scanGroupNames())),
                item.scanGroupLogo(), seen.contains(item.chapterId())));
        return new Result(mapped, releases.findAvailableLanguages(from, to, excludeAdult));
    }

    public static ZoneId parseZone(String timeZone) {
        try {
            return ZoneId.of(timeZone == null || timeZone.isBlank() ? "UTC" : timeZone);
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("Invalid time zone");
        }
    }

    private Collection<String> libraryRestriction(boolean libraryOnly, UUID userId) {
        if (!libraryOnly) return null;
        if (userId == null) throw new BusinessRuleException("Authentication is required for library releases", 401);
        return library.findByUserId(userId).stream().map(SavedManga::getTitleId).toList();
    }
}
