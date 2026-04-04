package com.mangareader.application.forum.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.domain.forum.entity.ForumReply;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.user.entity.User;
import com.mangareader.infrastructure.persistence.postgres.repository.UserJpaRepository;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Cria uma resposta em um tópico do fórum. Requer autenticação.
 */
@Service
@RequiredArgsConstructor
public class CreateForumReplyUseCase {

    private final ForumRepositoryPort forumRepository;
    private final UserJpaRepository userRepository;

    public record CreateReplyInput(UUID topicId, UUID userId, String content) {}

    @Transactional
    public ForumTopic execute(CreateReplyInput input) {
        ForumTopic topic = forumRepository.findById(input.topicId())
                .orElseThrow(() -> new ResourceNotFoundException("ForumTopic", "id", input.topicId()));

        User author = userRepository.findById(input.userId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", input.userId()));

        ForumReply reply = ForumReply.builder()
                .topic(topic)
                .author(author)
                .content(input.content())
                .build();

        topic.getReplies().add(reply);
        topic.setReplyCount(topic.getReplyCount() + 1);

        ForumTopic saved = forumRepository.save(topic);
        saved.getAuthor().getName();
        saved.getReplies().forEach(r -> r.getAuthor().getName());

        return saved;
    }
}
