package com.mangareader.application.forum.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Busca um tópico do fórum pelo ID (com replies).
 */
@Service
@RequiredArgsConstructor
public class GetForumTopicByIdUseCase {

    private final ForumRepositoryPort forumRepository;

    @Transactional(readOnly = true)
    public ForumTopic execute(UUID id) {
        ForumTopic topic = forumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ForumTopic", "id", id));

        topic.getAuthor().getName();
        topic.getReplies().forEach(r -> r.getAuthor().getName());

        return topic;
    }
}
