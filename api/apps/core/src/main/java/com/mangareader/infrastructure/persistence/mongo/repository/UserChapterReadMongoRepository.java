package com.mangareader.infrastructure.persistence.mongo.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.mangareader.domain.user.entity.UserChapterRead;

/**
 * Spring Data MongoDB repository para leituras de capítulo por usuário.
 */
public interface UserChapterReadMongoRepository extends MongoRepository<UserChapterRead, String> {
    Optional<UserChapterRead> findByUserIdAndTitleIdAndChapterNumber(String userId, String titleId, String chapterNumber);

    List<UserChapterRead> findAllByUserIdOrderByReadAtDesc(String userId);

    void deleteAllByUserId(String userId);

    void deleteByTitleId(String titleId);
}
