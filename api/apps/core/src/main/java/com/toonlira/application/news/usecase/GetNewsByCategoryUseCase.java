package com.toonlira.application.news.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.toonlira.application.news.port.NewsRepositoryPort;
import com.toonlira.domain.news.entity.NewsItem;
import com.toonlira.domain.news.valueobject.NewsCategory;

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
