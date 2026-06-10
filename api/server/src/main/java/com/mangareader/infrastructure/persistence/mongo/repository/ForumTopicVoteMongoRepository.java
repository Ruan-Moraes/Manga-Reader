package com.mangareader.infrastructure.persistence.mongo.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.domain.forum.entity.ForumTopicVote;

public interface ForumTopicVoteMongoRepository extends MongoRepository<ForumTopicVote, String> {
    Optional<ForumTopicVote> findByTopicIdAndUserId(String topicId, String userId);

    List<ForumTopicVote> findByTopicIdInAndUserId(Collection<String> topicIds, String userId);

    void deleteByTopicId(String topicId);
}
