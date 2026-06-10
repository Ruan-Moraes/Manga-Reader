package com.mangareader.application.forum.usecase;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.valueobject.CommentTarget;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Busca um tópico do fórum pelo ID, com as respostas (comentários unificados
 * {@code targetType=FORUM_TOPIC}).
 */
@Service
@RequiredArgsConstructor
public class GetForumTopicByIdUseCase {
    private final ForumRepositoryPort forumRepository;
    private final CommentRepositoryPort commentRepository;

    /** Tópico + respostas (comments do alvo). */
    public record ForumTopicDetail(ForumTopic topic, List<Comment> replies) {}

    public ForumTopicDetail execute(String id) {
        ForumTopic topic = forumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ForumTopic", "id", id));

        List<Comment> replies = commentRepository.findByTargetTypeAndTargetId(CommentTarget.FORUM_TOPIC, id);

        return new ForumTopicDetail(topic, replies);
    }
}
