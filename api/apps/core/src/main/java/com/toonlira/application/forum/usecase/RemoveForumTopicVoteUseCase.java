package com.toonlira.application.forum.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.forum.port.ForumRepositoryPort;
import com.toonlira.application.forum.port.ForumTopicVoteRepositoryPort;
import com.toonlira.domain.forum.entity.ForumTopic;
import com.toonlira.shared.application.vote.VoteResult;
import com.toonlira.shared.application.vote.VoteToggle;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Remove o voto de um usuário em um tópico do fórum (idempotente: sem voto,
 * apenas retorna os contadores atuais).
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class RemoveForumTopicVoteUseCase {
    private final ForumRepositoryPort forumRepository;
    private final ForumTopicVoteRepositoryPort voteRepository;

    public VoteResult execute(String topicId, String userId) {
        ForumTopic topic = forumRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("ForumTopic", "id", topicId));

        voteRepository.findByTopicIdAndUserId(topicId, userId).ifPresent(vote -> {
            VoteToggle.undo(topic, vote.getValue());
            voteRepository.delete(vote);
            forumRepository.save(topic);
        });

        return new VoteResult(topic.getUpvotes(), topic.getDownvotes(), null);
    }
}
