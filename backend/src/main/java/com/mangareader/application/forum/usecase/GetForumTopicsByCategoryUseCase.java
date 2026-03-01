package com.mangareader.application.forum.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;

import lombok.RequiredArgsConstructor;

/**
 * Filtra tópicos do fórum por categoria com paginação.
 */
@Service
@RequiredArgsConstructor
public class GetForumTopicsByCategoryUseCase {

    private final ForumRepositoryPort forumRepository;

    public Page<ForumTopic> execute(ForumCategory category, Pageable pageable) {
        return forumRepository.findByCategory(category, pageable);
    }
}
