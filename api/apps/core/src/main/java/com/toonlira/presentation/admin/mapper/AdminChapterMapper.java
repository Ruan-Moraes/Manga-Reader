package com.toonlira.presentation.admin.mapper;

import org.springframework.stereotype.Component;

import com.toonlira.application.manga.usecase.admin.EnrichAdminChaptersUseCase.Details;
import com.toonlira.domain.manga.entity.Chapter;
import com.toonlira.presentation.admin.dto.AdminChapterResponse;
import com.toonlira.shared.application.i18n.LocaleResolutionService;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AdminChapterMapper {
    private final LocaleResolutionService locale;

    public AdminChapterResponse toResponse(Details details) {
        Chapter chapter = details.chapter();
        String titleName = details.title() == null ? "" : locale.resolve(details.title().getName());
        var pages = chapter.getPageItems().stream().map(page -> new AdminChapterResponse.PageResponse(
                page.getId(), page.getOrder(), page.getOriginalFilename(), page.getImageUrl(), page.getThumbnailUrl(),
                page.getWidth(), page.getHeight(), page.getFileSize(), page.getFormat(), page.getProcessingStatus(),
                page.getCreatedAt(), page.getUpdatedAt())).toList();
        var metrics = details.metrics();
        return new AdminChapterResponse(chapter.getId(), chapter.getTitleId(), titleName,
                locale.resolve(chapter.getTitle()), chapter.getNumber(), chapter.getDisplayOrder(), chapter.getDescription(),
                chapter.getStatus().name(), chapter.getContentLanguage(), chapter.getScanGroupId(),
                chapter.getScanGroupName() == null ? null : locale.resolve(chapter.getScanGroupName()),
                chapter.getScanGroupLogo(), chapter.getPageItems().size(), chapter.readyPagesCount(), chapter.getPublishedAt(),
                chapter.getScheduledAt(), metrics == null ? 0 : metrics.totalReads(),
                metrics == null ? 0 : metrics.completionRate(), chapter.getCreatedAt(), chapter.getUpdatedAt(), chapter.getCreatedBy(),
                chapter.getUpdatedBy(), chapter.getDeletedAt(), chapter.getVersion(), pages);
    }
}
