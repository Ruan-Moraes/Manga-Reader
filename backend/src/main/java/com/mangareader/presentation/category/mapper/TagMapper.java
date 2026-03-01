package com.mangareader.presentation.category.mapper;

import java.util.List;

import com.mangareader.domain.category.entity.Tag;
import com.mangareader.presentation.category.dto.TagResponse;

/**
 * Mapper estático Tag → TagResponse.
 */
public final class TagMapper {

    private TagMapper() {
    }

    public static TagResponse toResponse(Tag tag) {
        return new TagResponse(
                tag.getId(),
                tag.getLabel()
        );
    }

    public static List<TagResponse> toResponseList(List<Tag> tags) {
        return tags.stream().map(TagMapper::toResponse).toList();
    }
}
