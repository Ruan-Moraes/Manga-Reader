package com.mangareader.application.news.port;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsCategory;

/**
 * Port de saída — acesso a dados de News (MongoDB).
 */
public interface NewsRepositoryPort {

    List<NewsItem> findAll();

    Optional<NewsItem> findById(String id);

    List<NewsItem> findByCategory(NewsCategory category);

    List<NewsItem> searchByTitle(String query);

    NewsItem save(NewsItem newsItem);

    void deleteById(String id);

    Page<NewsItem> findAll(Pageable pageable);

    Page<NewsItem> findByCategory(NewsCategory category, Pageable pageable);

    Page<NewsItem> searchByTitle(String query, Pageable pageable);

    long count();
}
