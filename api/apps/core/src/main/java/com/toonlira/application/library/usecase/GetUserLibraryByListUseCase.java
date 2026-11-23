package com.toonlira.application.library.usecase;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.library.port.LibraryRepositoryPort;
import com.toonlira.application.library.service.LibraryVisibilityService;
import com.toonlira.application.library.service.LibraryAdultContentService;
import com.toonlira.domain.library.entity.SavedManga;
import com.toonlira.domain.library.valueobject.ReadingListType;

import lombok.RequiredArgsConstructor;

/**
 * Retorna mangás salvos filtrados por tipo de lista de leitura, com paginação.
 * <p>
 * DT-49: quando o viewer não é o dono, respeita {@code libraryVisibility}
 * (biblioteca privada ⇒ página vazia, mesmo contrato do perfil enriquecido).
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GetUserLibraryByListUseCase {
    private final LibraryRepositoryPort libraryRepository;
    private final LibraryVisibilityService libraryVisibilityService;
    private final LibraryAdultContentService adultContentService;

    public Page<SavedManga> execute(UUID userId, UUID viewerUserId, ReadingListType list, Pageable pageable) {
        if (!libraryVisibilityService.canView(userId, viewerUserId)) {
            return Page.empty(pageable);
        }

        if (adultContentService.mustFilter(viewerUserId)) {
            return adultContentService.filterAndPageForViewer(
                    libraryRepository.findByUserIdAndList(userId, list), viewerUserId, pageable);
        }
        return adultContentService.enrichPage(libraryRepository.findByUserIdAndList(userId, list, pageable));
    }
}
