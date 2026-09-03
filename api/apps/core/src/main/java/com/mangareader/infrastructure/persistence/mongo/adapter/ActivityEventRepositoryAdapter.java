package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import com.mangareader.application.user.port.ActivityEventRepositoryPort;
import com.mangareader.domain.user.entity.ActivityEvent;
import com.mangareader.infrastructure.persistence.mongo.repository.ActivityEventMongoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port do feed de atividades ao Spring Data MongoDB.
 */
@Component
@RequiredArgsConstructor
public class ActivityEventRepositoryAdapter implements ActivityEventRepositoryPort {
    private final ActivityEventMongoRepository repository;
    private final MongoTemplate mongoTemplate;

    @Override
    public ActivityEvent save(ActivityEvent event) {
        return repository.save(event);
    }

    @Override
    public Page<ActivityEvent> findVisibleByUserId(String userId, Pageable pageable) {
        return repository.findByUserIdAndHiddenFalseOrderByOccurredAtDesc(userId, pageable);
    }

    @Override
    public List<ActivityEvent> findAllByUserId(String userId) {
        return repository.findAllByUserIdOrderByOccurredAtDesc(userId);
    }

    @Override
    public boolean hide(String eventId, String userId) {
        Query query = new Query(Criteria.where("id").is(eventId).and("userId").is(userId));
        Update update = new Update().set("hidden", true);

        var result = mongoTemplate.updateFirst(query, update, ActivityEvent.class);

        return result.getModifiedCount() > 0;
    }

    @Override
    public void deleteAllByUserId(String userId) {
        repository.deleteAllByUserId(userId);
    }
}
