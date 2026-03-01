package com.mangareader.application.news.usecase;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todas as notícias ordenadas por data de publicação.
 */
@Service
@RequiredArgsConstructor
public class GetNewsUseCase {

    private final NewsRepositoryPort newsRepository;

    public List<NewsItem> execute() {
        return newsRepository.findAll();
    }
}
