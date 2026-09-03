package com.mangareader.presentation.admin.mapper;

import org.springframework.stereotype.Component;

import com.mangareader.domain.store.entity.Store;
import com.mangareader.presentation.admin.dto.AdminStoreResponse;

@Component
public class AdminStoreMapper {
    public AdminStoreResponse toResponse(Store store) {
        return new AdminStoreResponse(store.getId().toString(), store.getName().values(), store.getWebsite(),
                store.getLogo(), store.getIcon(), store.getStatus().name(), store.getDisplayOrder());
    }
}
