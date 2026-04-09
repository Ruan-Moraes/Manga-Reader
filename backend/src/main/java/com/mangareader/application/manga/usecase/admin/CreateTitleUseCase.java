package com.mangareader.application.manga.usecase.admin;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;

import lombok.RequiredArgsConstructor;

/**
 * Cria um novo título (admin).
 */
@Service
@RequiredArgsConstructor
public class CreateTitleUseCase {

    private final TitleRepositoryPort titleRepository;

    public Title execute(String name, String type, String cover, String synopsis,
                         List<String> genres, String status, String author,
                         String artist, String publisher, boolean adult) {
        Title title = Title.builder()
                .name(name)
                .type(type)
                .cover(cover)
                .synopsis(synopsis)
                .genres(genres != null ? genres : List.of())
                .status(status)
                .author(author)
                .artist(artist)
                .publisher(publisher)
                .adult(adult)
                .build();

        return titleRepository.save(title);
    }
}
