package com.mangareader.domain.manga.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Version;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.domain.manga.valueobject.ChapterStatus;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Capítulo de um título (coleção própria MongoDB, referenciado por
 * {@code titleId}).
 * <p>
 * Antes era um subdocumento embedded em {@code Title.chapters}; migrado para
 * coleção dedicada (DT-17) — séries longas estouravam o limite de 16 MB por
 * documento. O título do capítulo é multilíngue ({@link LocalizedString}),
 * resolvido pelo locale do request na API.
 */
@Document(collection = "chapters")
@CompoundIndex(name = "idx_chapter_title_number_active", def = "{'titleId': 1, 'number': 1}",
        unique = true, partialFilter = "{'deleted': false}")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Chapter {
    @Id
    private String id;

    @Indexed
    private String titleId;

    private String number;
    private LocalizedString title;
    private String releaseDate;
    private String pages;

    @Builder.Default
    private int displayOrder = 0;
    private String description;
    @Builder.Default
    private ChapterStatus status = ChapterStatus.PUBLISHED;
    @Builder.Default
    private List<ChapterPage> pageItems = new ArrayList<>();
    private Instant scheduledAt;
    private Instant publishedAt;
    private Instant createdAt;
    private Instant updatedAt;
    private String createdBy;
    private String updatedBy;
    private Instant deletedAt;
    @Builder.Default
    private boolean deleted = false;
    @Version
    private Long version;

    public int readyPagesCount() {
        return (int) pageItems.stream().filter(page -> "ready".equalsIgnoreCase(page.getProcessingStatus())).count();
    }

    public boolean hasReadyPages() {
        return readyPagesCount() > 0 || (pages != null && !pages.isBlank() && !"0".equals(pages));
    }
}
