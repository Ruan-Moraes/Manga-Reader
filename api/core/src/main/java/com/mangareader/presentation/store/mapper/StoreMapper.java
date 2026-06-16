package com.mangareader.presentation.store.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.mangareader.domain.store.entity.Store;
import com.mangareader.presentation.shared.mapper.LocalizedMappingHelper;
import com.mangareader.presentation.store.dto.StoreResponse;

import lombok.RequiredArgsConstructor;

/**
 * Mapper Store → StoreResponse (público). Resolve campos i18n via
 * {@link LocalizedMappingHelper#toResolvedString}.
 */
@Component
@RequiredArgsConstructor
public class StoreMapper {

    private final LocalizedMappingHelper i18n;

    public StoreResponse toResponse(Store store) {
        return new StoreResponse(
                store.getId().toString(),
                i18n.toResolvedString(store.getName()),
                store.getLogo(),
                store.getIcon(),
                i18n.toResolvedString(store.getDescription()),
                store.getWebsite(),
                store.getAvailability() != null
                        ? store.getAvailability().name().toLowerCase()
                        : null,
                store.getRating(),
                store.getFeatures(),
                store.getPrice(),
                store.getOldPrice(),
                store.getCategory() != null
                        ? store.getCategory().name().toLowerCase()
                        : null,
                store.isOfficial(),
                store.getRatingCount(),
                store.getFormat(),
                store.getShipping(),
                store.getNote(),
                store.getMono(),
                store.getColor()
        );
    }

    public List<StoreResponse> toResponseList(List<Store> stores) {
        return stores.stream().map(this::toResponse).toList();
    }
}
