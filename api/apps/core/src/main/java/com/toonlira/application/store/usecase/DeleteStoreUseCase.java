package com.toonlira.application.store.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.store.port.StoreRepositoryPort;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DeleteStoreUseCase {
    private final StoreRepositoryPort storeRepository;

    @Transactional
    public void execute(UUID id) {
        if (storeRepository.findById(id).isEmpty()) throw new ResourceNotFoundException("Store", "id", id);
        storeRepository.deleteById(id);
    }
}
