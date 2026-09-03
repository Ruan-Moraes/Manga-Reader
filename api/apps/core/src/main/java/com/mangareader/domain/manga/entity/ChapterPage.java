package com.mangareader.domain.manga.entity;

import java.time.Instant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ChapterPage {
    private String id;
    private int order;
    private String originalFilename;
    private String imageUrl;
    private String thumbnailUrl;
    private int width;
    private int height;
    private long fileSize;
    private String format;
    private String processingStatus;
    private Instant createdAt;
    private Instant updatedAt;
}
