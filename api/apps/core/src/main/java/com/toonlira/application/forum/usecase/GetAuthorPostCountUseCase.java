package com.toonlira.application.forum.usecase;

import org.springframework.stereotype.Service;

import com.toonlira.application.forum.port.ForumRepositoryPort;

import lombok.RequiredArgsConstructor;

/**
 * Retorna a quantidade de tópicos criados por um autor no fórum.
 */
@Service
@RequiredArgsConstructor
public class GetAuthorPostCountUseCase {
    private final ForumRepositoryPort forumRepository;

    public long execute(String authorId) {
        return forumRepository.countByAuthorId(authorId);
    }
}
