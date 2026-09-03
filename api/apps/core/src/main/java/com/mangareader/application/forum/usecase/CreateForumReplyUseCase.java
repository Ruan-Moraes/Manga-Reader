package com.mangareader.application.forum.usecase;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.comment.usecase.CreateCommentUseCase;
import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.domain.comment.valueobject.CommentTarget;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Cria uma resposta em um tópico do fórum. Requer autenticação.
 * <p>
 * Modelo de comentário unificado: a resposta é um {@code Comment} com
 * {@code targetType=FORUM_TOPIC} — este use case apenas valida o tópico,
 * delega a criação ao domínio de comentários e mantém os desnormalizados do
 * tópico ({@code replyCount}, {@code lastActivityAt}).
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class CreateForumReplyUseCase {
    private final ForumRepositoryPort forumRepository;
    private final CreateCommentUseCase createCommentUseCase;

    public record CreateReplyInput(String topicId, UUID userId, String content) {}

    public ForumTopic execute(CreateReplyInput input) {
        ForumTopic topic = forumRepository.findById(input.topicId())
                .orElseThrow(() -> new ResourceNotFoundException("ForumTopic", "id", input.topicId()));

        if (topic.isLocked()) {
            throw new BusinessRuleException("Este tópico está trancado e não aceita respostas", 400);
        }

        createCommentUseCase.execute(new CreateCommentUseCase.CreateCommentInput(
                CommentTarget.FORUM_TOPIC,
                topic.getId(),
                input.content(),
                null,
                null,
                input.userId()
        ));

        topic.setReplyCount(topic.getReplyCount() + 1);
        topic.setLastActivityAt(LocalDateTime.now());

        return forumRepository.save(topic);
    }
}
