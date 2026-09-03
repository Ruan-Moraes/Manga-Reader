package com.mangareader.application.news.port;

import java.util.List;
import java.util.Optional;
import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.domain.news.valueobject.NewsStatus;

/**
 * Port de saída — acesso a dados de News (MongoDB).
 */
public interface NewsRepositoryPort {
    Optional<NewsItem> findById(String id);

    Optional<NewsItem> findByIdOrSlug(String idOrSlug);

    List<NewsItem> searchByTitle(String query);

    NewsItem save(NewsItem newsItem);

    void deleteById(String id);

    Page<NewsItem> findAll(Pageable pageable);

    Page<NewsItem> findByCategory(NewsCategory category, Pageable pageable);

    Page<NewsItem> searchByTitle(String query, Pageable pageable);

    Page<NewsItem> findPublished(String query, NewsCategory category, Instant publishedAfter, Instant now,
                                 Pageable pageable);

    Page<NewsItem> findAdmin(String query, NewsStatus status, NewsCategory category,
                             Pageable pageable);

    List<NewsItem> findRelated(NewsItem source, int limit);

    boolean existsBySlugAndIdNot(String slug, String id);

    List<NewsItem> findScheduledBefore(Instant instant);

    List<NewsItem> saveAll(List<NewsItem> items);

    long count();
}
