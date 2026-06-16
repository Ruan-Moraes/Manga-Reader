package com.mangareader.application.manga.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.group.port.GroupRepositoryPort;
import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.application.store.port.StoreRepositoryPort;

import lombok.RequiredArgsConstructor;

/**
 * Remove, na exclusão de um título, as referências cross-DB que apontam para ele
 * a partir do PostgreSQL: biblioteca dos usuários ({@code user_libraries}), obras
 * de grupos ({@code group_works}) e itens de loja ({@code store_titles}).
 * <p>
 * As junções {@code title_authors}/{@code title_publishers} são tratadas por
 * {@link TitleAssociationWriter}; este colaborador cuida das três tabelas restantes.
 * Ao limpar {@code group_works}, reconcilia {@code groups.total_titles} dos grupos
 * afetados (contador desnormalizado).
 * <p>
 * <b>Transação:</b> roda no gerenciador JPA primário ({@code transactionManager}) —
 * necessário para as queries {@code @Modifying}. Não é atômico com a escrita Mongo
 * do título (mesmo limite conhecido de {@link TitleAssociationWriter}; o job diário
 * do orphan-cleaner é a rede de segurança). Ver DT em {@code docs/tech-debt.md}.
 */
@Service
@Transactional("transactionManager")
@RequiredArgsConstructor
public class TitleReferenceCleaner {
    private final LibraryRepositoryPort libraryRepository;
    private final GroupRepositoryPort groupRepository;
    private final StoreRepositoryPort storeRepository;

    public void clear(String titleId) {
        libraryRepository.deleteByTitleId(titleId);
        storeRepository.deleteByTitleId(titleId);
        groupRepository.deleteWorksByTitleId(titleId);
    }
}
