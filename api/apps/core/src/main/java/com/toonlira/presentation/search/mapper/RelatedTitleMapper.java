package com.toonlira.presentation.search.mapper;

import com.toonlira.application.search.RelatedTitleResult;
import com.toonlira.presentation.search.dto.RelatedTitleResponse;

public final class RelatedTitleMapper {
    private RelatedTitleMapper() {
    }

    public static RelatedTitleResponse toResponse(RelatedTitleResult result) {
        return new RelatedTitleResponse(
                result.id(), result.name(), result.cover(), result.type(),
                result.status(), result.adult(), result.roles());
    }
}
