package com.mangareader.presentation.category.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.mangareader.domain.category.entity.Tag;
import com.mangareader.presentation.category.dto.TagAdminResponse;
import com.mangareader.presentation.category.dto.TagResponse;
import com.mangareader.presentation.shared.mapper.LocalizedMappingHelper;

import lombok.RequiredArgsConstructor;

/**
 * Mapper Tag → DTOs.
 *
 * <p>{@link #toResponse(Tag)} resolve o label para o locale do request (DTO público).
 * <p>{@link #toAdminResponse(Tag)} expõe todas as traduções (DTO admin para edição).
 *
 * <p>Durante a Fase A da migração i18n, se {@code labelI18n} estiver vazio,
 * cai para {@link Tag#getLabel()} via {@link LocalizedMappingHelper#resolveOrFallback}.
 */
@Component
@RequiredArgsConstructor
public class TagMapper {

    private final LocalizedMappingHelper i18n;

    public TagResponse toResponse(Tag tag) {
        return new TagResponse(
                tag.getId(),
                i18n.resolveOrFallback(tag.getLabelI18n(), tag.getLabel()));
    }

    public List<TagResponse> toResponseList(List<Tag> tags) {
        return tags.stream().map(this::toResponse).toList();
    }

    public TagAdminResponse toAdminResponse(Tag tag) {
        return new TagAdminResponse(tag.getId(), i18n.toMap(tag.getLabelI18n()));
    }
}
