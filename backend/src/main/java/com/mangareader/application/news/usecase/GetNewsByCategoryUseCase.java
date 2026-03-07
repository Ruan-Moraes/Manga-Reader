package com.mangareader.application.news.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.domain.news.valueobject.NewsCategory;

import lombok.RequiredArgsConstructor;

/**
 * Filtra notícias por categoria.
 */
@Service
@RequiredArgsConstructor
public class GetNewsByCategoryUseCase {

    private final NewsRepositoryPort newsRepository;

    public Page<NewsItem> execute(NewsCategory category, Pageable pageable) {
        return newsRepository.findByCategory(category, pageable);
    }
}
