package com.mangareader.infrastructure.persistence.mongo.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.mangareader.domain.manga.entity.Title;

/**
 * Spring Data MongoDB Repository para Titles.
 */
public interface TitleMongoRepository extends MongoRepository<Title, String> {

    List<Title> findByGenresContaining(String genre);

    List<Title> findByNameContainingIgnoreCase(String name);

    @Query("{ 'genres': { $all: ?0 } }")
    List<Title> findByGenresContainingAll(List<String> genres);

    // ── Paginated ────────────────────────────────────────────────────────

    Page<Title> findByGenresContaining(String genre, Pageable pageable);

    Page<Title> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("{ 'genres': { $all: ?0 } }")
    Page<Title> findByGenresContainingAll(List<String> genres, Pageable pageable);
}
