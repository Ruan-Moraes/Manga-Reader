package com.mangareader.application.manga.service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.manga.usecase.admin.TitleStoreAssignment;
import com.mangareader.application.store.port.StoreRepositoryPort;
import com.mangareader.application.store.port.StoreTitleRepositoryPort;
import com.mangareader.domain.store.entity.StoreTitle;
import com.mangareader.shared.exception.BusinessRuleException;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/** Mantém os vínculos Postgres de um título Mongo com semântica replace. */
@Service
@RequiredArgsConstructor
public class TitleStoreAssociationWriter {
    private final StoreRepositoryPort storeRepository;
    private final StoreTitleRepositoryPort storeTitleRepository;

    @Transactional
    public void replace(String titleId, List<TitleStoreAssignment> assignments) {
        if (assignments == null) return;
        Set<java.util.UUID> ids = new HashSet<>();
        var links = assignments.stream().map(assignment -> {
            if (assignment == null || assignment.storeId() == null || assignment.url() == null || assignment.url().isBlank()) {
                throw new BusinessRuleException("Loja e URL de compra são obrigatórias", 400);
            }
            if (!ids.add(assignment.storeId())) throw new BusinessRuleException("Uma loja só pode ser vinculada uma vez", 400);
            var store = storeRepository.findById(assignment.storeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Store", "id", assignment.storeId()));
            return StoreTitle.builder().store(store).titleId(titleId).url(assignment.url().trim()).build();
        }).toList();
        storeTitleRepository.deleteByTitleId(titleId);
        storeTitleRepository.saveAll(links);
    }

    @Transactional
    public void clear(String titleId) { storeTitleRepository.deleteByTitleId(titleId); }
}
