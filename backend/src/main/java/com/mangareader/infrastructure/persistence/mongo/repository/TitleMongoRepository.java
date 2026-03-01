package com.mangareader.infrastructure.persistence.mongo.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.domain.manga.entity.Title;

/**
 * Spring Data MongoDB Repository para Titles.
 */
public interface TitleMongoRepository extends MongoRepository<Title, String> {

    List<Title> findByGenresContaining(String genre);

    List<Title> findByNameContainingIgnoreCase(String name);
}
