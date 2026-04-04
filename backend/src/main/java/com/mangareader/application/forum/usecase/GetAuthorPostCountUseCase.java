package com.mangareader.application.forum.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.forum.port.ForumRepositoryPort;

import lombok.RequiredArgsConstructor;

/**
 * Retorna a quantidade de tópicos criados por um autor no fórum.
 */
@Service
@RequiredArgsConstructor
public class GetAuthorPostCountUseCase {

    private final ForumRepositoryPort forumRepository;

    @Transactional(readOnly = true)
    public long execute(UUID authorId) {
        return forumRepository.countByAuthorId(authorId);
    }
}
