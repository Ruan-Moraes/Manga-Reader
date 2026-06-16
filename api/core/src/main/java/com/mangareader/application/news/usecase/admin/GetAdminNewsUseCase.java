package com.mangareader.application.news.usecase.admin;

import org.springframework.stereotype.Service;

import com.mangareader.application.news.port.NewsRepositoryPort;
import com.mangareader.domain.news.entity.NewsItem;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Busca administrativa de uma notícia por ID (entidade crua, sem resolução de
 * locale — o mapper admin expõe todos os idiomas).
 */
@Service
@RequiredArgsConstructor
public class GetAdminNewsUseCase {
    private final NewsRepositoryPort newsRepository;

    public NewsItem execute(String id) {
        return newsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("News", "id", id));
    }
}
