package com.mangareader.application.forum.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Remove um tópico do fórum.
 * <p>
 * Somente o autor do tópico pode removê-lo.
 */
@Service
@RequiredArgsConstructor
public class DeleteForumTopicUseCase {

    private final ForumRepositoryPort forumRepository;

    @Transactional
    public void execute(UUID topicId, UUID userId) {
        ForumTopic topic = forumRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("ForumTopic", "id", topicId));

        if (!topic.getAuthor().getId().equals(userId)) {
            throw new BusinessRuleException("Você só pode remover seus próprios tópicos", 403);
        }

        forumRepository.deleteById(topicId);
    }
}
