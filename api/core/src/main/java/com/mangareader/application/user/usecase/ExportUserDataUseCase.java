package com.mangareader.application.user.usecase;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.analytics.port.BehaviorEventRepositoryPort;
import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.application.user.port.ActivityEventRepositoryPort;
import com.mangareader.application.user.port.ReadingProgressRepositoryPort;
import com.mangareader.application.user.port.RecommendationRepositoryPort;
import com.mangareader.application.user.port.UserChapterReadRepositoryPort;
import com.mangareader.application.user.port.UserRepositoryPort;
import com.mangareader.application.user.port.ViewHistoryRepositoryPort;
import com.mangareader.application.user.service.UserProfileSettingsResolver;
import com.mangareader.domain.analytics.entity.BehaviorEvent;
import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.domain.user.entity.activity.ActivityPayload;
import com.mangareader.domain.user.valueobject.AdultContentPreference;
import com.mangareader.domain.user.valueobject.VisibilitySetting;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ExportUserDataUseCase {
    private final UserRepositoryPort userRepository;
    private final UserProfileSettingsResolver profileSettingsResolver;
    private final LibraryRepositoryPort libraryRepository;
    private final RecommendationRepositoryPort recommendationRepository;
    private final ReadingProgressRepositoryPort readingProgressRepository;
    private final ViewHistoryRepositoryPort viewHistoryRepository;
    private final UserChapterReadRepositoryPort chapterReadRepository;
    private final ActivityEventRepositoryPort activityEventRepository;
    private final BehaviorEventRepositoryPort behaviorEventRepository;

    public record Account(UUID id, String name, String username, String email, LocalDateTime createdAt) {}
    public record Privacy(VisibilitySetting commentVisibility, VisibilitySetting viewHistoryVisibility,
            VisibilitySetting libraryVisibility, AdultContentPreference adultContentPreference,
            boolean behaviorAnalyticsEnabled) {}
    public record LibraryItem(String titleId, String name, String type, ReadingListType list,
            LocalDateTime savedAt) {}
    public record Recommendation(String titleId, String titleName, int position, LocalDateTime createdAt) {}
    public record ReadingProgressItem(String titleId, String chapterNumber, int currentPage, int totalPages,
            boolean completed, LocalDateTime updatedAt) {}
    public record ViewHistoryItem(String titleId, String titleName, LocalDateTime viewedAt) {}
    public record ChapterReadItem(String titleId, String chapterNumber, LocalDateTime readAt) {}
    public record ActivityItem(String id, String type, ActivityPayload payload, LocalDateTime occurredAt,
            boolean hidden) {}
    public record ExportData(Instant generatedAt, Account account, Privacy privacy, List<LibraryItem> library,
            List<Recommendation> recommendations, List<ReadingProgressItem> readingProgress,
            List<ViewHistoryItem> viewHistory, List<ChapterReadItem> chapterReads,
            List<ActivityItem> activities, List<BehaviorEvent> behaviorEvents) {}

    @Transactional(readOnly = true)
    public ExportData execute(UUID userId) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        var settings = profileSettingsResolver.getOrDefault(user);
        String userIdString = userId.toString();

        var library = libraryRepository.findByUserId(userId).stream()
                .map(item -> new LibraryItem(item.getTitleId(), item.getName(), item.getType(), item.getList(),
                        item.getSavedAt()))
                .toList();
        var recommendations = recommendationRepository.findByUserIdOrderByPosition(userId).stream()
                .map(item -> new Recommendation(item.getTitleId(), item.getTitleName(), item.getPosition(),
                        item.getCreatedAt()))
                .toList();
        var readingProgress = readingProgressRepository.findAllByUserId(userIdString).stream()
                .map(item -> new ReadingProgressItem(item.getTitleId(), item.getChapterNumber(),
                        item.getCurrentPage(), item.getTotalPages(), item.isCompleted(), item.getUpdatedAt()))
                .toList();
        var viewHistory = viewHistoryRepository.findAllByUserId(userIdString).stream()
                .map(item -> new ViewHistoryItem(item.getTitleId(), item.getTitleName(), item.getViewedAt()))
                .toList();
        var chapterReads = chapterReadRepository.findAllByUserId(userIdString).stream()
                .map(item -> new ChapterReadItem(item.getTitleId(), item.getChapterNumber(), item.getReadAt()))
                .toList();
        var activities = activityEventRepository.findAllByUserId(userIdString).stream()
                .map(item -> new ActivityItem(item.getId(), item.getType().name(), item.getPayload(),
                        item.getOccurredAt(), item.isHidden()))
                .toList();

        return new ExportData(Instant.now(),
                new Account(user.getId(), user.getName(), user.getUsername(), user.getEmail(), user.getCreatedAt()),
                new Privacy(settings.getCommentVisibility(), settings.getViewHistoryVisibility(),
                        settings.getLibraryVisibility(), settings.getAdultContentPreference(),
                        settings.isBehaviorAnalyticsEnabled()),
                library, recommendations, readingProgress, viewHistory, chapterReads, activities,
                behaviorEventRepository.findAllByUserId(userIdString));
    }
}
