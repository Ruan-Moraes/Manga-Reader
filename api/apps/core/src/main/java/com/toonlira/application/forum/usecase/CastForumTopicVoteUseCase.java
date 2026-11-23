package com.toonlira.application.forum.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.forum.port.ForumRepositoryPort;
import com.toonlira.application.forum.port.ForumTopicVoteRepositoryPort;
import com.toonlira.domain.forum.entity.ForumTopic;
import com.toonlira.domain.forum.entity.ForumTopicVote;
import com.toonlira.shared.application.vote.VoteResult;
import com.toonlira.shared.application.vote.VoteToggle;
import com.toonlira.shared.domain.vote.VoteValue;
import com.toonlira.shared.exception.BusinessRuleException;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Registra o voto "Útil"/"Contrário" de um usuário em um tópico do fórum.
 * <p>
 * Modelo de voto único: a regra do toggle vive em {@link VoteToggle}; aqui
 * ficam a validação (tópico existe, self-vote proibido) e a persistência.
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class CastForumTopicVoteUseCase {
    private final ForumRepositoryPort forumRepository;
    private final ForumTopicVoteRepositoryPort voteRepository;

    public VoteResult execute(String topicId, String userId, VoteValue value) {
        ForumTopic topic = forumRepository.findById(topicId)
                .orElseThrow(() -> new ResourceNotFoundException("ForumTopic", "id", topicId));

        if (userId.equals(topic.getAuthorId())) {
            throw new BusinessRuleException("Não é possível votar no próprio tópico", 409);
        }

        ForumTopicVote existing = voteRepository.findByTopicIdAndUserId(topicId, userId).orElse(null);

        VoteValue myVote = VoteToggle.apply(
                topic,
                existing != null ? existing.getValue() : null,
                value,
                new VoteToggle.VoteStore() {
                    @Override
                    public void create(VoteValue v) {
                        voteRepository.save(ForumTopicVote.builder()
                                .topicId(topicId)
                                .userId(userId)
                                .value(v)
                                .build());
                    }

                    @Override
                    public void switchTo(VoteValue v) {
                        existing.setValue(v);
                        voteRepository.save(existing);
                    }

                    @Override
                    public void delete() {
                        voteRepository.delete(existing);
                    }
                });

        forumRepository.save(topic);

        return new VoteResult(topic.getUpvotes(), topic.getDownvotes(), myVote);
    }
}
