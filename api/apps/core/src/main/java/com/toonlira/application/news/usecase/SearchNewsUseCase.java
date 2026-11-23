package com.toonlira.application.news.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.toonlira.application.news.port.NewsRepositoryPort;
import com.toonlira.domain.news.entity.NewsItem;

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
