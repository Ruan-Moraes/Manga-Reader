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
    @Query("{ 'genres': { $all: ?0 } }")
    List<Title> findByGenresContainingAll(List<String> genres);

    Page<Title> findByGenresContaining(String genre, Pageable pageable);

    @Query("{ 'genres': { $all: ?0 } }")
    Page<Title> findByGenresContainingAll(List<String> genres, Pageable pageable);
}
