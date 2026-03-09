package com.mangareader.presentation.store.mapper;

import java.util.List;

import com.mangareader.domain.store.entity.Store;
import com.mangareader.presentation.store.dto.StoreResponse;

/**
 * Mapper estático Store → StoreResponse.
 */
public final class StoreMapper {

    private StoreMapper() {
    }

    public static StoreResponse toResponse(Store store) {
        return new StoreResponse(
                store.getId().toString(),
                store.getName(),
                store.getLogo(),
                store.getIcon(),
                store.getDescription(),
                store.getWebsite(),
                store.getAvailability() != null
                        ? store.getAvailability().name().toLowerCase()
                        : null,
                store.getRating(),
                store.getFeatures()
        );
    }

    public static List<StoreResponse> toResponseList(List<Store> stores) {
        return stores.stream().map(StoreMapper::toResponse).toList();
    }
}
