package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

import com.mangareader.application.user.port.ReadingProgressRepositoryPort;
import com.mangareader.domain.user.entity.ReadingProgress;
import com.mangareader.infrastructure.persistence.mongo.repository.ReadingProgressMongoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port de ReadingProgress ao Spring Data MongoDB.
 */
@Component
@RequiredArgsConstructor
public class ReadingProgressRepositoryAdapter implements ReadingProgressRepositoryPort {
    private final ReadingProgressMongoRepository repository;
    private final MongoTemplate mongoTemplate;

    @Override
    public Optional<ReadingProgress> findByUserIdAndTitleIdAndChapterNumber(String userId, String titleId, String chapterNumber) {
        return repository.findByUserIdAndTitleIdAndChapterNumber(userId, titleId, chapterNumber);
    }

    @Override
    public ReadingProgress save(ReadingProgress progress) {
        Query naturalKey = new Query(Criteria.where("userId").is(progress.getUserId())
                .and("titleId").is(progress.getTitleId())
                .and("chapterNumber").is(progress.getChapterNumber()));
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        Update update = new Update()
                .set("currentPage", progress.getCurrentPage())
                .set("totalPages", progress.getTotalPages())
                .set("completed", progress.isCompleted())
                .set("updatedAt", now)
                .setOnInsert("userId", progress.getUserId())
                .setOnInsert("titleId", progress.getTitleId())
                .setOnInsert("chapterNumber", progress.getChapterNumber())
                .setOnInsert("createdAt", now);
        return java.util.Objects.requireNonNull(mongoTemplate.findAndModify(naturalKey, update,
                FindAndModifyOptions.options().upsert(true).returnNew(true), ReadingProgress.class));
    }

    @Override
    public Optional<ReadingProgress> findLatestByUserIdAndTitleId(String userId, String titleId) {
        return repository.findTopByUserIdAndTitleIdOrderByUpdatedAtDesc(userId, titleId);
    }

    @Override
    public List<ReadingProgress> findAllByUserId(String userId) {
        return repository.findAllByUserIdOrderByUpdatedAtDesc(userId);
    }

    @Override
    public void deleteAllByUserId(String userId) {
        repository.deleteAllByUserId(userId);
    }

    @Override
    public void deleteByTitleId(String titleId) {
        repository.deleteByTitleId(titleId);
    }
}
