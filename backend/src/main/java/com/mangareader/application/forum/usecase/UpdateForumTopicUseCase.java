package com.mangareader.application.forum.usecase;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.domain.forum.valueobject.ForumCategory;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza um tópico existente do fórum.
 * <p>
 * Somente o autor do tópico pode editá-lo.
 */
@Service
@RequiredArgsConstructor
public class UpdateForumTopicUseCase {

    private final ForumRepositoryPort forumRepository;

    public record UpdateTopicInput(
            UUID topicId,
            UUID userId,
            String title,
            String content,
            ForumCategory category,
            List<String> tags
    ) {}

    @Transactional
    public ForumTopic execute(UpdateTopicInput input) {
        ForumTopic topic = forumRepository.findById(input.topicId())
                .orElseThrow(() -> new ResourceNotFoundException("ForumTopic", "id", input.topicId()));

        if (!topic.getAuthor().getId().equals(input.userId())) {
            throw new BusinessRuleException("Você só pode editar seus próprios tópicos", 403);
        }

        if (topic.isLocked()) {
            throw new BusinessRuleException("Este tópico está trancado e não pode ser editado", 400);
        }

        if (input.title() != null) {
            topic.setTitle(input.title());
        }
        if (input.content() != null) {
            topic.setContent(input.content());
        }
        if (input.category() != null) {
            topic.setCategory(input.category());
        }
        if (input.tags() != null) {
            topic.setTags(input.tags());
        }

        ForumTopic saved = forumRepository.save(topic);
        saved.getAuthor().getName();
        saved.getReplies().forEach(r -> r.getAuthor().getName());

        return saved;
    }
}
