package com.mangareader.presentation.store.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.mangareader.domain.store.entity.Store;
import com.mangareader.presentation.shared.mapper.LocalizedMappingHelper;
import com.mangareader.presentation.store.dto.StoreResponse;

import lombok.RequiredArgsConstructor;

/**
 * Mapper Store → StoreResponse (público). Resolve campos i18n via
 * {@link LocalizedMappingHelper#resolveOrFallback}.
 */
@Component
@RequiredArgsConstructor
public class StoreMapper {

    private final LocalizedMappingHelper i18n;

    public StoreResponse toResponse(Store store) {
        return new StoreResponse(
                store.getId().toString(),
                i18n.resolveOrFallback(store.getNameI18n(), store.getName()),
                store.getLogo(),
                store.getIcon(),
                i18n.resolveOrFallback(store.getDescriptionI18n(), store.getDescription()),
                store.getWebsite(),
                store.getAvailability() != null
                        ? store.getAvailability().name().toLowerCase()
                        : null,
                store.getRating(),
                store.getFeatures()
        );
    }

    public List<StoreResponse> toResponseList(List<Store> stores) {
        return stores.stream().map(this::toResponse).toList();
    }
}
