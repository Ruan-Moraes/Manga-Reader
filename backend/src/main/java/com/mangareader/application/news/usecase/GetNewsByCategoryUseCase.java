package com.mangareader.application.news.usecase;

import java.util.List;

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

    public List<NewsItem> execute(NewsCategory category) {
        return newsRepository.findByCategory(category);
    }
}
