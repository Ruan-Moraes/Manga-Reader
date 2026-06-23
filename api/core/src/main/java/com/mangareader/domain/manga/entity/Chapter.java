package com.mangareader.domain.manga.entity;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.mangareader.shared.domain.i18n.LocalizedString;

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
@CompoundIndex(name = "idx_chapter_title_number", def = "{'titleId': 1, 'number': 1}", unique = true)
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
}
