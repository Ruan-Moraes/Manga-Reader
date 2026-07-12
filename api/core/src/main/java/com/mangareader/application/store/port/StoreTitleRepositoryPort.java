package com.mangareader.application.store.port;

import java.util.List;

import com.mangareader.domain.store.entity.StoreTitle;

public interface StoreTitleRepositoryPort {
    List<StoreTitle> findByTitleId(String titleId);

    void deleteByTitleId(String titleId);

    void saveAll(List<StoreTitle> links);
}
