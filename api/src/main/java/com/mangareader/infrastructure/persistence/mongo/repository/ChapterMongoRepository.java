package com.mangareader.infrastructure.persistence.mongo.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.domain.manga.entity.Chapter;

/**
 * Spring Data MongoDB repository para capítulos.
 */
public interface ChapterMongoRepository extends MongoRepository<Chapter, String> {
    Page<Chapter> findByTitleId(String titleId, Pageable pageable);

    Optional<Chapter> findByTitleIdAndNumber(String titleId, String number);

    long countByTitleId(String titleId);

    void deleteByTitleId(String titleId);
}
