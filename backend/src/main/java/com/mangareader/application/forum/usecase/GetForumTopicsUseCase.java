package com.mangareader.application.forum.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.domain.forum.entity.ForumTopic;

import lombok.RequiredArgsConstructor;

/**
 * Retorna tópicos do fórum com paginação.
 */
@Service
@RequiredArgsConstructor
public class GetForumTopicsUseCase {

    private final ForumRepositoryPort forumRepository;

    public Page<ForumTopic> execute(Pageable pageable) {
        return forumRepository.findAll(pageable);
    }
}
