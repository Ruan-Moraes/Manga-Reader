package com.mangareader.application.forum.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional(readOnly = true)
    public Page<ForumTopic> execute(Pageable pageable) {
        Page<ForumTopic> page = forumRepository.findAll(pageable);

        page.getContent().forEach(topic -> {
            topic.getAuthor().getName();
            topic.getReplies().forEach(r -> r.getAuthor().getName());
        });

        return page;
    }
}
