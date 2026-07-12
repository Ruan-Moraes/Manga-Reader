package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.List;

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
    @Override public void deleteByTitleId(String titleId) { repository.deleteByTitleId(titleId); }
    @Override public void saveAll(List<StoreTitle> links) { repository.saveAll(links); }
}
