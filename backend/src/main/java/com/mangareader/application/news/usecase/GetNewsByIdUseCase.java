package com.mangareader.application.news.usecase;

import org.springframework.stereotype.Service;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Busca uma notícia pelo ID.
 */
@Service
@RequiredArgsConstructor
public class GetNewsByIdUseCase {
    private final NewsRepositoryPort newsRepository;

    public NewsItem execute(String id) {
        return newsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("NewsItem", "id", id));
    }
}
