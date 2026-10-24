package com.toonlira.application.manga.usecase.admin;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.manga.port.TitleRepositoryPort;
import com.toonlira.application.manga.service.TitleAssociationWriter;
import com.toonlira.application.manga.service.TitleReferenceCleaner;
import com.toonlira.application.shared.port.CacheInvalidationPort;
import com.toonlira.application.user.port.ReadingProgressRepositoryPort;
import com.toonlira.shared.constant.CacheNames;
import com.toonlira.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Exclui um título (admin) e limpa suas referências relacionais no PostgreSQL:
 * junções ({@code title_authors}, {@code title_publishers}) e refs cross-DB
 * ({@code user_libraries}, {@code group_works}, {@code store_titles}), além do
 * progresso de leitura no MongoDB (mesma transação Mongo deste use case).
 */
@Service
@Transactional("mongoTransactionManager")
@RequiredArgsConstructor
public class DeleteTitleUseCase {
    private final TitleRepositoryPort titleRepository;
    private final TitleAssociationWriter associationWriter;
    private final TitleReferenceCleaner referenceCleaner;
    private final ReadingProgressRepositoryPort readingProgressRepository;
    private final CacheInvalidationPort cacheInvalidation;

    public void execute(String titleId) {
        titleRepository.findById(titleId)
                .orElseThrow(() -> new ResourceNotFoundException("Title", "id", titleId));

        associationWriter.clear(titleId);
        referenceCleaner.clear(titleId);
        readingProgressRepository.deleteByTitleId(titleId);

        titleRepository.deleteById(titleId);
        cacheInvalidation.evictAfterCommit(CacheNames.TITLE, titleId);
        cacheInvalidation.clearAfterCommit(CacheNames.PUBLIC_STATS);
    }
}
