package com.mangareader.infrastructure.persistence.mongo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.domain.user.entity.ReadingProgress;

/**
 * Spring Data MongoDB repository para progresso de leitura por usuário.
 */
public interface ReadingProgressMongoRepository extends MongoRepository<ReadingProgress, String> {
    Optional<ReadingProgress> findByUserIdAndTitleIdAndChapterNumber(String userId, String titleId, String chapterNumber);

    Optional<ReadingProgress> findTopByUserIdAndTitleIdOrderByUpdatedAtDesc(String userId, String titleId);

    List<ReadingProgress> findAllByUserIdOrderByUpdatedAtDesc(String userId);

    void deleteAllByUserId(String userId);

    void deleteByTitleId(String titleId);
}
