package com.mangareader.application.forum.port;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import com.mangareader.domain.forum.entity.ForumTopicVote;

/**
 * Port de saída — votos em tópicos do fórum (MongoDB). Modelo de voto único.
 */
public interface ForumTopicVoteRepositoryPort {
    Optional<ForumTopicVote> findByTopicIdAndUserId(String topicId, String userId);

    /** Votos do usuário para um conjunto de tópicos — resolve {@code myVote} em lote, sem N+1. */
    List<ForumTopicVote> findByTopicIdInAndUserId(Collection<String> topicIds, String userId);

    ForumTopicVote save(ForumTopicVote vote);

    void delete(ForumTopicVote vote);

    void deleteByTopicId(String topicId);
}
