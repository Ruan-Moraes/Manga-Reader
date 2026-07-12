package com.mangareader.application.store.usecase;

import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.store.port.StoreRepositoryPort;
import com.mangareader.domain.store.entity.Store;
import com.mangareader.domain.store.valueobject.StoreStatus;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UpdateStoreUseCase {
    private final StoreRepositoryPort storeRepository;

    @Transactional
    public Store execute(UUID id, Map<String, String> name, String website, String logo, String icon,
            StoreStatus status, Integer displayOrder) {
        Store store = storeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Store", "id", id));
        if (name != null) store.setName(LocalizedString.of(name));
        if (website != null) store.setWebsite(website);
        if (logo != null) store.setLogo(logo);
        if (icon != null) store.setIcon(icon);
        if (status != null) store.setStatus(status);
        if (displayOrder != null) store.setDisplayOrder(displayOrder);
        return storeRepository.save(store);
    }
}
