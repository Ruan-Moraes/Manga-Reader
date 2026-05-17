package com.mangareader.application.manga.usecase.admin;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.shared.domain.i18n.LocalizedString;

import lombok.RequiredArgsConstructor;

/**
 * Cria um novo título (admin).
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class CreateTitleUseCase {
    private final TitleRepositoryPort titleRepository;

    public Title execute(Map<String, String> name, String type, String cover,
                         Map<String, String> synopsis,
                         List<String> genres, String status, String author,
                         String artist, String publisher, boolean adult) {
        Title title = Title.builder()
                .name(toLocalized(name))
                .type(type)
                .cover(cover)
                .synopsis(toLocalized(synopsis))
                .genres(genres != null ? genres : List.of())
                .status(status)
                .author(author)
                .artist(artist)
                .publisher(publisher)
                .adult(adult)
                .build();

        return titleRepository.save(title);
    }

    private static LocalizedString toLocalized(Map<String, String> map) {
        return (map == null || map.isEmpty()) ? LocalizedString.empty() : LocalizedString.of(map);
    }
}
