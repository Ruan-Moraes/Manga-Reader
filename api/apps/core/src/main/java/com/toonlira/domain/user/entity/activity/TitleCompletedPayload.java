package com.toonlira.domain.user.entity.activity;

public record TitleCompletedPayload(String titleId, String titleName, String titleCover)
        implements ActivityPayload {
}
