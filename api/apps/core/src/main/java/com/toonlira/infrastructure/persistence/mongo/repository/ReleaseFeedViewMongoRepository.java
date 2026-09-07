package com.toonlira.infrastructure.persistence.mongo.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.toonlira.infrastructure.persistence.mongo.document.ReleaseFeedViewDocument;

public interface ReleaseFeedViewMongoRepository extends MongoRepository<ReleaseFeedViewDocument, String> {
    List<ReleaseFeedViewDocument> findByUserIdAndChapterIdIn(String userId, Iterable<String> chapterIds);

    void deleteByChapterId(String chapterId);

    void deleteAllByUserId(String userId);
}
