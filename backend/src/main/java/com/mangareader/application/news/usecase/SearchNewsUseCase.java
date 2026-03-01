package com.mangareader.application.news.usecase;

import java.util.List;

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

    public List<NewsItem> execute(String query) {
        return newsRepository.searchByTitle(query);
    }
}
