package com.mangareader.application.news.usecase.admin;

import org.springframework.stereotype.Service;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Exclui uma notícia (admin).
 */
@Service
@RequiredArgsConstructor
public class DeleteNewsUseCase {
    private final NewsRepositoryPort newsRepository;

    public void execute(String newsId) {
        newsRepository.findById(newsId)
                .orElseThrow(() -> new ResourceNotFoundException("News", "id", newsId));

        newsRepository.deleteById(newsId);
    }
}
