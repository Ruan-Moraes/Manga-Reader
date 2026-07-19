package com.mangareader.application.manga.usecase.admin;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.manga.port.ChapterRepositoryPort;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Chapter;
import com.mangareader.domain.manga.entity.ChapterPage;
import com.mangareader.domain.manga.valueobject.ChapterStatus;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional("mongoTransactionManager")
public class AdminChapterUseCase {
    private final ChapterRepositoryPort chapters;
    private final TitleRepositoryPort titles;
    private final Clock clock;

    public record CreateInput(String titleId, Map<String, String> title, String number, Integer displayOrder,
            String description, ChapterStatus status, Instant scheduledAt) {}
    public record UpdateInput(Map<String, String> title, String number, Integer displayOrder, String description,
            Instant scheduledAt, Long version) {}
    public record LegacyPageInput(String id, int order, String originalFilename, String imageUrl,
            String thumbnailUrl, int width, int height, long fileSize, String format,
            String processingStatus, Instant createdAt, Instant updatedAt) {}
    public record LegacyChapterInput(String legacyId, String titleId, String title, String number,
            Integer displayOrder, String description, String status, Instant scheduledAt,
            Instant publishedAt, Instant createdAt, Instant updatedAt, List<LegacyPageInput> pages) {}
    public record LegacyImportFailure(String legacyId, String reason) {}
    public record LegacyImportResult(List<String> accepted, List<String> skipped,
            List<LegacyImportFailure> rejected) {}

    public Chapter create(CreateInput input, UUID actorId) {
        if (input.titleId() == null || input.titleId().isBlank() || titles.findById(input.titleId()).isEmpty()) {
            throw new ResourceNotFoundException("Title", "id", input.titleId());
        }
        String number = normalizeNumber(input.number());
        assertNumberAvailable(input.titleId(), number, null);
        ChapterStatus status = input.status() == null ? ChapterStatus.DRAFT : input.status();
        validateSchedule(status, input.scheduledAt());
        if (status == ChapterStatus.PUBLISHED) throw new BusinessRuleException("Chapter publication requires at least one ready page", 422);
        Instant now = clock.instant();
        Chapter chapter = Chapter.builder()
                .titleId(input.titleId()).title(requiredTitle(input.title())).number(number)
                .displayOrder(input.displayOrder() == null ? 0 : input.displayOrder())
                .description(trimToNull(input.description())).status(status).scheduledAt(input.scheduledAt())
                .createdAt(now).updatedAt(now).createdBy(actorId.toString()).build();
        return saveWithUniqueNumber(chapter);
    }

    public Chapter update(String id, UpdateInput input, UUID actorId) {
        Chapter chapter = get(id);
        if (input.version() != null && !input.version().equals(chapter.getVersion())) {
            throw new BusinessRuleException("Chapter was modified by another user", 409);
        }
        if (input.title() != null) chapter.setTitle(requiredTitle(input.title()));
        if (input.number() != null) {
            String normalized = normalizeNumber(input.number());
            assertNumberAvailable(chapter.getTitleId(), normalized, id);
            chapter.setNumber(normalized);
        }
        if (input.displayOrder() != null) chapter.setDisplayOrder(input.displayOrder());
        if (input.description() != null) chapter.setDescription(trimToNull(input.description()));
        if (input.scheduledAt() != null) {
            validateSchedule(ChapterStatus.SCHEDULED, input.scheduledAt());
            chapter.setScheduledAt(input.scheduledAt());
        }
        touch(chapter, actorId);
        return saveWithUniqueNumber(chapter);
    }

    public Chapter changeStatus(String id, ChapterStatus status, Instant scheduledAt, UUID actorId) {
        Chapter chapter = get(id);
        if (status == null || !chapter.getStatus().canTransitionTo(status)) {
            throw new BusinessRuleException("Invalid chapter status transition", 422);
        }
        validateSchedule(status, scheduledAt);
        if (status == ChapterStatus.PUBLISHED && !hasReadyPages(chapter)) {
            throw new BusinessRuleException("Chapter publication requires at least one ready page", 422);
        }
        chapter.setStatus(status);
        if (status == ChapterStatus.PUBLISHED) {
            chapter.setPublishedAt(chapter.getPublishedAt() == null ? clock.instant() : chapter.getPublishedAt());
            chapter.setScheduledAt(null);
        } else if (status == ChapterStatus.SCHEDULED) {
            chapter.setScheduledAt(scheduledAt);
        } else {
            chapter.setScheduledAt(null);
        }
        touch(chapter, actorId);
        return chapters.save(chapter);
    }

    public void softDelete(String id, UUID actorId) {
        Chapter chapter = get(id);
        chapter.setDeletedAt(clock.instant());
        chapter.setDeleted(true);
        chapter.setStatus(ChapterStatus.ARCHIVED);
        touch(chapter, actorId);
        chapters.save(chapter);
    }

    public void reorder(String titleId, List<String> orderedIds, UUID actorId) {
        List<Chapter> active = chapters.findActiveByTitleId(titleId);
        var expectedIds = active.stream().map(Chapter::getId).collect(java.util.stream.Collectors.toSet());
        var suppliedIds = orderedIds == null ? java.util.Set.<String>of() : new HashSet<>(orderedIds);
        if (orderedIds == null || orderedIds.size() != active.size()
                || suppliedIds.size() != orderedIds.size() || !suppliedIds.equals(expectedIds)) {
            throw new BusinessRuleException("Chapter reorder must contain the complete active set", 422);
        }
        Map<String, Chapter> byId = active.stream()
                .collect(java.util.stream.Collectors.toMap(Chapter::getId, chapter -> chapter));
        var reordered = new ArrayList<Chapter>(orderedIds.size());
        for (int index = 0; index < orderedIds.size(); index++) {
            Chapter chapter = byId.get(orderedIds.get(index));
            chapter.setDisplayOrder(index + 1);
            touch(chapter, actorId);
            reordered.add(chapter);
        }
        chapters.saveAll(reordered);
    }

    public Chapter duplicate(String id, UUID actorId) {
        Chapter source = get(id);
        List<Chapter> siblings = chapters.findActiveByTitleId(source.getTitleId());
        Instant now = clock.instant();
        List<ChapterPage> sourcePages = source.getPageItems() == null ? List.of() : source.getPageItems();
        List<ChapterPage> pages = sourcePages.stream()
                .map(page -> ChapterPage.builder()
                        .id(UUID.randomUUID().toString()).order(page.getOrder())
                        .originalFilename(page.getOriginalFilename()).imageUrl(page.getImageUrl())
                        .thumbnailUrl(page.getThumbnailUrl()).width(page.getWidth()).height(page.getHeight())
                        .fileSize(page.getFileSize()).format(page.getFormat())
                        .processingStatus(page.getProcessingStatus()).createdAt(now).updatedAt(now).build())
                .toList();
        Chapter copy = Chapter.builder()
                .titleId(source.getTitleId()).title(source.getTitle()).number(nextChapterNumber(siblings))
                .releaseDate(source.getReleaseDate()).pages(source.getPages())
                .displayOrder(siblings.size() + 1).description(source.getDescription())
                .status(ChapterStatus.DRAFT).pageItems(pages)
                .createdAt(now).updatedAt(now).createdBy(actorId.toString()).build();
        return saveWithUniqueNumber(copy);
    }

    /**
     * Importação idempotente do antigo storage administrativo. O ID Mongo é
     * derivado do ator e do ID legado; uma repetição após resposta perdida é
     * reconhecida como já importada, sem duplicar capítulos.
     */
    @Transactional(value = "mongoTransactionManager", propagation = Propagation.NOT_SUPPORTED)
    public LegacyImportResult importLegacy(List<LegacyChapterInput> inputs, UUID actorId) {
        if (inputs == null || inputs.isEmpty() || inputs.size() > 1000) {
            throw new BusinessRuleException("Legacy import must contain between 1 and 1000 chapters", 422);
        }
        List<String> accepted = new ArrayList<>();
        List<String> skipped = new ArrayList<>();
        List<LegacyImportFailure> rejected = new ArrayList<>();

        for (LegacyChapterInput input : inputs) {
            String legacyId = input.legacyId() == null ? "" : input.legacyId().trim();
            try {
                if (legacyId.isBlank()) throw new BusinessRuleException("legacyId is required", 422);
                String id = legacyMongoId(actorId, legacyId);
                if (chapters.findById(id).isPresent()) {
                    skipped.add(legacyId);
                    continue;
                }
                if (input.titleId() == null || titles.findById(input.titleId()).isEmpty()) {
                    throw new BusinessRuleException("Referenced title does not exist", 422);
                }
                String number = normalizeNumber(input.number());
                assertNumberAvailable(input.titleId(), number, null);
                List<ChapterPage> pages = mapLegacyPages(input.pages());
                ChapterStatus status = parseLegacyStatus(input.status());
                validateSchedule(status, input.scheduledAt());
                if (status == ChapterStatus.PUBLISHED && pages.stream()
                        .noneMatch(page -> "ready".equalsIgnoreCase(page.getProcessingStatus()))) {
                    throw new BusinessRuleException("Published legacy chapter requires a ready page", 422);
                }
                Instant now = clock.instant();
                Chapter chapter = Chapter.builder().id(id).titleId(input.titleId())
                        .title(requiredTitle(Map.of("pt-BR", input.title()))).number(number)
                        .displayOrder(input.displayOrder() == null ? 0 : input.displayOrder())
                        .description(trimToNull(input.description())).status(status)
                        .scheduledAt(status == ChapterStatus.SCHEDULED ? input.scheduledAt() : null)
                        .publishedAt(status == ChapterStatus.PUBLISHED
                                ? (input.publishedAt() == null ? now : input.publishedAt()) : null)
                        .createdAt(input.createdAt() == null ? now : input.createdAt())
                        .updatedAt(input.updatedAt() == null ? now : input.updatedAt())
                        .createdBy(actorId.toString()).updatedBy(actorId.toString()).pageItems(pages).build();
                saveWithUniqueNumber(chapter);
                accepted.add(legacyId);
            } catch (BusinessRuleException | ResourceNotFoundException exception) {
                rejected.add(new LegacyImportFailure(legacyId, exception.getMessage()));
            }
        }
        return new LegacyImportResult(List.copyOf(accepted), List.copyOf(skipped), List.copyOf(rejected));
    }

    @Transactional(value = "mongoTransactionManager", readOnly = true)
    public Chapter get(String id) {
        return chapters.findById(id).filter(chapter -> chapter.getDeletedAt() == null)
                .orElseThrow(() -> new ResourceNotFoundException("Chapter", "id", id));
    }

    @Transactional(value = "mongoTransactionManager", readOnly = true)
    public Page<Chapter> list(String titleId, List<ChapterStatus> statuses, String search,
            Instant publishedFrom, Instant publishedTo, boolean includeDeleted, Pageable pageable) {
        return chapters.findAdmin(titleId, statuses, search, publishedFrom, publishedTo, includeDeleted, pageable);
    }

    private void assertNumberAvailable(String titleId, String number, String excludeId) {
        if (chapters.existsActiveByTitleIdAndNumber(titleId, number, excludeId)) {
            throw new BusinessRuleException("Chapter number already exists for this title", 409);
        }
    }

    private Chapter saveWithUniqueNumber(Chapter chapter) {
        try {
            return chapters.save(chapter);
        } catch (DuplicateKeyException exception) {
            throw new BusinessRuleException("Chapter number already exists for this title", 409);
        }
    }

    private void validateSchedule(ChapterStatus status, Instant scheduledAt) {
        if (status == ChapterStatus.SCHEDULED && (scheduledAt == null || !scheduledAt.isAfter(clock.instant()))) {
            throw new BusinessRuleException("Scheduled chapter requires a future publication time", 422);
        }
    }

    private boolean hasReadyPages(Chapter chapter) {
        return chapter.hasReadyPages();
    }

    private String normalizeNumber(String value) {
        try {
            BigDecimal number = new BigDecimal(value == null ? "" : value.trim());
            if (number.signum() < 0) throw new NumberFormatException();
            return number.stripTrailingZeros().toPlainString();
        } catch (NumberFormatException exception) {
            throw new BusinessRuleException("Invalid chapter number", 422);
        }
    }

    private String nextChapterNumber(List<Chapter> chapters) {
        BigDecimal maximum = chapters.stream().map(Chapter::getNumber).map(value -> {
            if (value == null) return BigDecimal.ZERO;
            try { return new BigDecimal(value); }
            catch (NumberFormatException exception) { return BigDecimal.ZERO; }
        }).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        return maximum.add(BigDecimal.ONE).stripTrailingZeros().toPlainString();
    }

    private LocalizedString requiredTitle(Map<String, String> title) {
        if (title == null || title.getOrDefault(LocalizedString.DEFAULT_TAG, "").isBlank()) {
            throw new BusinessRuleException("Chapter title is required in pt-BR", 422);
        }
        return LocalizedString.of(title);
    }

    private void touch(Chapter chapter, UUID actorId) {
        chapter.setUpdatedAt(clock.instant());
        chapter.setUpdatedBy(actorId.toString());
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private List<ChapterPage> mapLegacyPages(List<LegacyPageInput> inputs) {
        if (inputs == null) return List.of();
        if (inputs.size() > 500) throw new BusinessRuleException("A chapter cannot import more than 500 pages", 422);
        Instant now = clock.instant();
        List<ChapterPage> pages = new ArrayList<>();
        int order = 0;
        for (LegacyPageInput input : inputs.stream().sorted(java.util.Comparator.comparingInt(LegacyPageInput::order)).toList()) {
            validateMediaUrl(input.imageUrl());
            validateMediaUrl(input.thumbnailUrl());
            pages.add(ChapterPage.builder().id(input.id()).order(++order)
                    .originalFilename(input.originalFilename()).imageUrl(input.imageUrl())
                    .thumbnailUrl(input.thumbnailUrl()).width(input.width()).height(input.height())
                    .fileSize(input.fileSize()).format(input.format())
                    .processingStatus(input.processingStatus() == null ? "ready" : input.processingStatus())
                    .createdAt(input.createdAt() == null ? now : input.createdAt())
                    .updatedAt(input.updatedAt() == null ? now : input.updatedAt()).build());
        }
        return pages;
    }

    private void validateMediaUrl(String value) {
        try {
            var uri = java.net.URI.create(value == null ? "" : value);
            if (!("https".equalsIgnoreCase(uri.getScheme()) || "http".equalsIgnoreCase(uri.getScheme()))) {
                throw new IllegalArgumentException();
            }
        } catch (IllegalArgumentException exception) {
            throw new BusinessRuleException("Legacy page URL must use HTTP or HTTPS", 422);
        }
    }

    private ChapterStatus parseLegacyStatus(String value) {
        if (value == null || value.isBlank()) return ChapterStatus.DRAFT;
        try {
            return ChapterStatus.valueOf(value.trim().toUpperCase(java.util.Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BusinessRuleException("Invalid legacy chapter status", 422);
        }
    }

    private String legacyMongoId(UUID actorId, String legacyId) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest((actorId + ":" + legacyId).getBytes(StandardCharsets.UTF_8));
            return "legacy-" + java.util.HexFormat.of().formatHex(digest, 0, 12);
        } catch (java.security.NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }
}
