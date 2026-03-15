package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsCategory;
import com.mangareader.infrastructure.persistence.mongo.repository.NewsMongoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que implementa {@link NewsRepositoryPort} usando Spring Data MongoDB.
 */
@Component
@RequiredArgsConstructor
public class NewsRepositoryAdapter implements NewsRepositoryPort {
    private final NewsMongoRepository repository;

    @Override
    public List<NewsItem> findAll() {
        return repository.findAllByOrderByPublishedAtDesc();
    }

    @Override
    public Optional<NewsItem> findById(String id) {
        return repository.findById(id);
    }

    @Override
    public List<NewsItem> findByCategory(NewsCategory category) {
        return repository.findByCategory(category);
    }

    @Override
    public List<NewsItem> searchByTitle(String query) {
        return repository.findByTitleContainingIgnoreCase(query);
    }

    @Override
    public NewsItem save(NewsItem newsItem) {
        return repository.save(newsItem);
    }

    @Override
    public void deleteById(String id) {
        repository.deleteById(id);
    }

    @Override
    public Page<NewsItem> findAll(Pageable pageable) {
        return repository.findAll(pageable);
    }

    @Override
    public Page<NewsItem> findByCategory(NewsCategory category, Pageable pageable) {
        return repository.findByCategory(category, pageable);
    }

    @Override
    public Page<NewsItem> searchByTitle(String query, Pageable pageable) {
        return repository.findByTitleContainingIgnoreCase(query, pageable);
    }
}
