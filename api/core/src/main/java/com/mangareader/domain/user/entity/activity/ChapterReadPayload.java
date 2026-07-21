package com.mangareader.domain.user.entity.activity;

public record ChapterReadPayload(String titleId, String titleName, String titleCover, String chapterNumber)
        implements ActivityPayload {
}
