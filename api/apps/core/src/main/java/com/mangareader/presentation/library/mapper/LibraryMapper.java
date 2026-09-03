package com.mangareader.presentation.library.mapper;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

import com.mangareader.application.label.service.DomainLabelService;
import com.mangareader.domain.library.entity.SavedManga;
import com.mangareader.presentation.library.dto.SavedMangaResponse;

import lombok.RequiredArgsConstructor;

/**
 * Mapper SavedManga → SavedMangaResponse. Label da lista resolvido via
 * {@link DomainLabelService} (type {@code reading_list_type}); fallback para
 * {@code ReadingListType.getDisplayName()} se não houver entrada no banco.
 */
@Component
@RequiredArgsConstructor
public class LibraryMapper {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
    private static final String LABEL_TYPE_READING_LIST = "reading_list_type";

    private final DomainLabelService domainLabels;

    public SavedMangaResponse toResponse(SavedManga saved) {
        if (saved == null) return null;

        String listLabel = domainLabels.resolveLabel(
                LABEL_TYPE_READING_LIST,
                saved.getList().name(),
                saved.getList().getDisplayName());

        return new SavedMangaResponse(
                saved.getTitleId(),
                saved.getName(),
                saved.getCover(),
                saved.getType(),
                saved.isAdult(),
                listLabel,
                formatDate(saved.getSavedAt())
        );
    }

    public List<SavedMangaResponse> toResponseList(List<SavedManga> savedMangas) {
        if (savedMangas == null) return Collections.emptyList();
        return savedMangas.stream().map(this::toResponse).toList();
    }

    private static String formatDate(LocalDateTime dateTime) {
        if (dateTime == null) return null;
        return dateTime.format(FMT);
    }
}
