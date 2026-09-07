package com.toonlira.application.store.port;

import java.util.List;
import java.util.Collection;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.toonlira.domain.store.entity.StoreTitle;

public interface StoreTitleRepositoryPort {
    List<StoreTitle> findByTitleId(String titleId);

    List<StoreTitle> findByTitleIdIn(Collection<String> titleIds);

    Page<StoreTitle> findByTitleId(String titleId, Pageable pageable);

    void deleteByTitleId(String titleId);

    void saveAll(List<StoreTitle> links);
}
