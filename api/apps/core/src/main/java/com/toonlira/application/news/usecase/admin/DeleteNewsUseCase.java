package com.toonlira.application.news.usecase.admin;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.news.port.NewsRepositoryPort;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Exclui uma notícia (admin).
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class DeleteNewsUseCase {
    private final NewsRepositoryPort newsRepository;

    public void execute(String newsId) {
        newsRepository.findById(newsId)
                .orElseThrow(() -> new ResourceNotFoundException("News", "id", newsId));

        newsRepository.deleteById(newsId);
    }
}
