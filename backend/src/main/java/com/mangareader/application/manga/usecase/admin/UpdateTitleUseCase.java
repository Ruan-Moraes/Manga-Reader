package com.mangareader.application.manga.usecase.admin;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza um título existente (admin).
 */
@Service
@RequiredArgsConstructor
public class UpdateTitleUseCase {
    private final TitleRepositoryPort titleRepository;

    public Title execute(String titleId, String name, String type, String cover,
                         String synopsis, List<String> genres, String status,
                         String author, String artist, String publisher, Boolean adult) {
        Title title = titleRepository.findById(titleId)
                .orElseThrow(() -> new ResourceNotFoundException("Title", "id", titleId));

        if (name != null) title.setName(name);
        if (type != null) title.setType(type);
        if (cover != null) title.setCover(cover);
        if (synopsis != null) title.setSynopsis(synopsis);
        if (genres != null) title.setGenres(genres);
        if (status != null) title.setStatus(status);
        if (author != null) title.setAuthor(author);
        if (artist != null) title.setArtist(artist);
        if (publisher != null) title.setPublisher(publisher);
        if (adult != null) title.setAdult(adult);

        return titleRepository.save(title);
    }
}
