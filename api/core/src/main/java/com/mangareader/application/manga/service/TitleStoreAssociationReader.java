package com.mangareader.application.manga.service;

import java.util.List;
import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.store.port.StoreTitleRepositoryPort;
import com.mangareader.domain.store.entity.StoreTitle;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TitleStoreAssociationReader {
    private final StoreTitleRepositoryPort storeTitleRepository;

    @Transactional(readOnly = true)
    public List<StoreTitle> byTitle(String titleId) {
        return storeTitleRepository.findByTitleId(titleId);
    }

    @Transactional(readOnly = true)
    public Map<String, List<StoreTitle>> byTitles(Collection<String> titleIds) {
        return storeTitleRepository.findByTitleIdIn(titleIds).stream()
                .collect(Collectors.groupingBy(StoreTitle::getTitleId));
    }
}
