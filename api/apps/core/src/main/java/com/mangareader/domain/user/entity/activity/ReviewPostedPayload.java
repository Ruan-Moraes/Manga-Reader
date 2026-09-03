package com.mangareader.domain.user.entity.activity;

public record ReviewPostedPayload(
        String titleId, String titleName, String titleCover, String reviewId, double rating)
        implements ActivityPayload {
}
