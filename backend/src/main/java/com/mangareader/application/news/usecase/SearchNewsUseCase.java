package com.mangareader.application.news.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;

import lombok.RequiredArgsConstructor;

/**
 * Busca notícias por texto no título.
 */
@Service
@RequiredArgsConstructor
public class SearchNewsUseCase {

    private final NewsRepositoryPort newsRepository;

    public Page<NewsItem> execute(String query, Pageable pageable) {
        return newsRepository.searchByTitle(query, pageable);
    }
}
