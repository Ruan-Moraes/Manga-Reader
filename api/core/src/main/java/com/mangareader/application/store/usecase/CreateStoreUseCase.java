package com.mangareader.application.store.usecase;

import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.store.port.StoreRepositoryPort;
import com.mangareader.domain.store.entity.Store;
import com.mangareader.domain.store.valueobject.StoreStatus;
import com.mangareader.shared.domain.i18n.LocalizedString;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CreateStoreUseCase {
    private final StoreRepositoryPort storeRepository;

    @Transactional
    public Store execute(Map<String, String> name, String website, String logo, String icon,
            StoreStatus status, int displayOrder) {
        return storeRepository.save(Store.builder()
                .name(LocalizedString.of(name)).website(website).logo(logo).icon(icon)
                .status(status).displayOrder(displayOrder).build());
    }
}
