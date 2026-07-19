package com.mangareader.presentation.store.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.mangareader.domain.store.entity.Store;
import com.mangareader.domain.store.entity.StoreTitle;
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
        return toResponse(store, null);
    }

    /** Mapeia uma loja vinculada ao título, expondo o link direto de compra. */
    public StoreResponse toResponse(StoreTitle storeTitle) {
        Store store = storeTitle.getStore();
        return toResponse(store, storeTitle.getUrl() != null ? storeTitle.getUrl() : store.getWebsite());
    }

    private StoreResponse toResponse(Store store, String purchaseUrl) {
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
                store.getColor(),
                purchaseUrl
        );
    }

    public List<StoreResponse> toResponseList(List<Store> stores) {
        return stores.stream().map(this::toResponse).toList();
    }
}
