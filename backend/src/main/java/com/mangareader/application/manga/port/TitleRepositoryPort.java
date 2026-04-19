package com.mangareader.application.manga.port;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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

    List<Title> findByFilters(List<String> genres, String status, Boolean adult);

    Title save(Title title);

    void deleteById(String id);

    Page<Title> findAll(Pageable pageable);

    Page<Title> findByGenresContaining(String genre, Pageable pageable);

    Page<Title> searchByName(String query, Pageable pageable);

    Page<Title> findByGenresContainingAll(List<String> genres, Pageable pageable);

    long count();

    long countByStatus(String status);

    long countTotalChapters();

    List<Title> findTopByRankingScore(int limit);
}
