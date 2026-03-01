package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.List;
import java.util.Optional;

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
}
