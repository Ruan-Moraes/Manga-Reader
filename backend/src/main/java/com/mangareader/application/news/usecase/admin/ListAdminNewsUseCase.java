package com.mangareader.application.news.usecase.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;

import lombok.RequiredArgsConstructor;

/**
 * Listagem administrativa de notícias com busca opcional por título.
 */
@Service
@RequiredArgsConstructor
public class ListAdminNewsUseCase {
    private final NewsRepositoryPort newsRepository;

    public Page<NewsItem> execute(String search, Pageable pageable) {
        return (search != null && !search.isBlank())
                ? newsRepository.searchByTitle(search, pageable)
                : newsRepository.findAll(pageable);
    }
}
