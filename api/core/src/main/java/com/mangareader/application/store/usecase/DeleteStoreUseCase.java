package com.mangareader.application.store.usecase;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.store.port.StoreRepositoryPort;
import com.mangareader.shared.exception.ResourceNotFoundException;

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
