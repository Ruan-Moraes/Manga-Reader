package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.mangareader.application.forum.port.ForumTopicVoteRepositoryPort;
import com.mangareader.domain.forum.entity.ForumTopicVote;
import com.mangareader.infrastructure.persistence.mongo.repository.ForumTopicVoteMongoRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class ForumTopicVoteRepositoryAdapter implements ForumTopicVoteRepositoryPort {
    private final ForumTopicVoteMongoRepository repository;

    @Override
    public Optional<ForumTopicVote> findByTopicIdAndUserId(String topicId, String userId) {
        return repository.findByTopicIdAndUserId(topicId, userId);
    }

    @Override
    public List<ForumTopicVote> findByTopicIdInAndUserId(Collection<String> topicIds, String userId) {
        return repository.findByTopicIdInAndUserId(topicIds, userId);
    }

    @Override
    public ForumTopicVote save(ForumTopicVote vote) {
        return repository.save(vote);
    }

    @Override
    public void delete(ForumTopicVote vote) {
        repository.delete(vote);
    }

    @Override
    public void deleteByTopicId(String topicId) {
        repository.deleteByTopicId(topicId);
    }
}
