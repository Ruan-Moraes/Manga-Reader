package com.mangareader.infrastructure.persistence.mongo.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsCategory;

/**
 * Repositório MongoDB para notícias.
 */
public interface NewsMongoRepository extends MongoRepository<NewsItem, String> {

    List<NewsItem> findByCategory(NewsCategory category);

    List<NewsItem> findByTitleContainingIgnoreCase(String query);

    List<NewsItem> findByIsFeaturedTrue();

    List<NewsItem> findAllByOrderByPublishedAtDesc();
}
