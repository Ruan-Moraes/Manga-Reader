package com.mangareader.application.forum.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.comment.port.CommentRepositoryPort;
import com.mangareader.application.comment.port.CommentVoteRepositoryPort;
import com.mangareader.application.forum.port.ForumRepositoryPort;
import com.mangareader.application.forum.port.ForumTopicVoteRepositoryPort;
import com.mangareader.domain.comment.entity.Comment;
import com.mangareader.domain.comment.valueobject.CommentTarget;
import com.mangareader.domain.forum.entity.ForumTopic;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Remove um tópico do fórum (somente o autor), em cascata: as respostas
 * (comments targetType=FORUM_TOPIC) e os votos do tópico vão junto — sem FK no
 * Mongo, a cascata é responsabilidade do use case.
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class DeleteForumTopicUseCase {

    private final ForumRepositoryPort forumRepository;
    private final CommentRepositoryPort commentRepository;
    private final CommentVoteRepositoryPort commentVoteRepository;
    private final ForumTopicVoteRepositoryPort voteRepository;

    public void execute(String topicId, UUID userId) {
        ForumTopic topic = forumRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("ForumTopic", "id", topicId));

        if (!topic.getAuthorId().equals(userId.toString())) {
            throw new BusinessRuleException("Você só pode remover seus próprios tópicos", 403);
        }

        var replyIds = commentRepository.findByTargetTypeAndTargetId(CommentTarget.FORUM_TOPIC, topicId)
                .stream().map(Comment::getId).toList();
        if (!replyIds.isEmpty()) {
            commentVoteRepository.deleteByCommentIdIn(replyIds);
        }

        commentRepository.deleteByTargetTypeAndTargetId(CommentTarget.FORUM_TOPIC, topicId);
        voteRepository.deleteByTopicId(topicId);
        forumRepository.deleteById(topicId);
    }
}
