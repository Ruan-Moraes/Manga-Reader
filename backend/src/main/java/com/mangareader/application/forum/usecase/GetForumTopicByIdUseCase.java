package com.mangareader.application.forum.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;

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

    public ForumTopic execute(UUID id) {
        return forumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ForumTopic", "id", id));
    }
}
