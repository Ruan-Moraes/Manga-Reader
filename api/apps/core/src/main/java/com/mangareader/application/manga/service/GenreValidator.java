package com.mangareader.application.manga.service;

import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import org.springframework.stereotype.Component;

import com.mangareader.application.category.port.TagRepositoryPort;

import lombok.RequiredArgsConstructor;

/**
 * Valida que os gêneros de um título são slugs existentes no vocabulário
 * controlado de {@code tags} (PostgreSQL). Não há FK cross-DB Mongo<->Postgres
 * (ver docs/database-modeling.md); a integridade é garantida aqui, na escrita.
 */
@Component
@RequiredArgsConstructor
public class GenreValidator {
    private final TagRepositoryPort tagRepository;

    /**
     * @throws IllegalArgumentException se algum slug não existir no vocabulário (HTTP 400).
     */
    public void validate(List<String> genres) {
        if (genres == null || genres.isEmpty()) {
            return;
        }

        Set<String> existing = tagRepository.findExistingSlugs(genres);

        Set<String> unknown = new TreeSet<>(genres);
        unknown.removeAll(existing);

        if (!unknown.isEmpty()) {
            throw new IllegalArgumentException("Gênero(s) inválido(s): " + String.join(", ", unknown));
        }
    }
}
