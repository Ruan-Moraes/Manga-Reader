package com.mangareader.infrastructure.persistence.mongo.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.infrastructure.persistence.mongo.document.NewsDocument;

/**
 * Repositório MongoDB para notícias.
 */
public interface NewsMongoRepository extends MongoRepository<NewsDocument, String> {
    Page<NewsDocument> findByCategory(NewsCategory category, Pageable pageable);
}
