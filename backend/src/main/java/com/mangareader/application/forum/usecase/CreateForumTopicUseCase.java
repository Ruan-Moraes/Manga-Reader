package com.mangareader.application.forum.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.domain.user.entity.User;
import com.mangareader.infrastructure.persistence.postgres.repository.UserJpaRepository;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Cria um novo tópico no fórum. Requer autenticação.
 */
@Service
@RequiredArgsConstructor
public class CreateForumTopicUseCase {

    private final ForumRepositoryPort forumRepository;
    private final UserJpaRepository userRepository;

    public record CreateTopicInput(UUID userId, String title, String content, ForumCategory category, java.util.List<String> tags) {}

    public ForumTopic execute(CreateTopicInput input) {
        User author = userRepository.findById(input.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", input.userId()));

        ForumTopic topic = ForumTopic.builder()
                .author(author)
                .title(input.title())
                .content(input.content())
                .category(input.category())
                .tags(input.tags() != null ? input.tags() : new java.util.ArrayList<>())
                .build();

        return forumRepository.save(topic);
    }
}
