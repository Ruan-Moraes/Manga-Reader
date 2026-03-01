package com.mangareader.application.manga.port;

import java.util.List;
import java.util.Optional;

import com.mangareader.domain.manga.entity.Title;

/**
 * Port de saída — acesso a dados de Titles (MongoDB).
 */
public interface TitleRepositoryPort {

    List<Title> findAll();

    Optional<Title> findById(String id);

    List<Title> findByGenresContaining(String genre);

    List<Title> searchByName(String query);

    List<Title> findByGenresContainingAll(List<String> genres);

    Title save(Title title);

    void deleteById(String id);
}
