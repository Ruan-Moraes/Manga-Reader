package com.mangareader.presentation.manga.dto;

import java.util.List;

public record ReaderChapterResponse(String id, String titleId, String number, String title, String status, List<Page> pages) {
    public record Page(String id, int order, String imageUrl, String thumbnailUrl, int width, int height) {}
}
