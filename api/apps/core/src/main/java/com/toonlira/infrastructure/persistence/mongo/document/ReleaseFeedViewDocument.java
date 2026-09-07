package com.toonlira.infrastructure.persistence.mongo.document;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Document(collection = "release_feed_views")
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ReleaseFeedViewDocument {
    @Id
    private String id;
    private String userId;
    private String chapterId;
    private Instant seenAt;
}
