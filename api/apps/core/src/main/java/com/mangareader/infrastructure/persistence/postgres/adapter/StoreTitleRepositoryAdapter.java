package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.List;
import java.util.Collection;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.store.port.StoreTitleRepositoryPort;
import com.mangareader.domain.store.entity.StoreTitle;
import com.mangareader.infrastructure.persistence.postgres.repository.StoreTitleJpaRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class StoreTitleRepositoryAdapter implements StoreTitleRepositoryPort {
    private final StoreTitleJpaRepository repository;

    @Override public List<StoreTitle> findByTitleId(String titleId) { return repository.findByTitleId(titleId); }
    @Override public List<StoreTitle> findByTitleIdIn(Collection<String> titleIds) {
        return titleIds == null || titleIds.isEmpty() ? List.of() : repository.findByTitleIdIn(titleIds);
    }
    @Override public Page<StoreTitle> findByTitleId(String titleId, Pageable pageable) {
        return repository.findByTitleId(titleId, pageable);
    }
    @Override public void deleteByTitleId(String titleId) { repository.deleteByTitleId(titleId); }
    @Override public void saveAll(List<StoreTitle> links) { repository.saveAll(links); }
}
