package com.mangareader.application.manga.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.store.port.StoreTitleRepositoryPort;
import com.mangareader.presentation.admin.dto.TitleStoreResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TitleStoreAssociationReader {
    private final StoreTitleRepositoryPort storeTitleRepository;

    @Transactional(readOnly = true)
    public List<TitleStoreResponse> byTitle(String titleId) {
        return storeTitleRepository.findByTitleId(titleId).stream()
                .map(link -> new TitleStoreResponse(link.getStore().getId().toString(),
                        link.getStore().getName().resolve(java.util.Locale.forLanguageTag("pt-BR")),
                        link.getStore().getLogo(), link.getUrl()))
                .toList();
    }
}
