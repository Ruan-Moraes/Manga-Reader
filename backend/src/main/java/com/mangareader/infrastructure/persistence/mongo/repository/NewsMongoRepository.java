package com.mangareader.infrastructure.persistence.mongo.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsCategory;

/**
 * Repositório MongoDB para notícias.
 */
public interface NewsMongoRepository extends MongoRepository<NewsItem, String> {
    Page<NewsItem> findByCategory(NewsCategory category, Pageable pageable);
}
