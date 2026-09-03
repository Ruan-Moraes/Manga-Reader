package com.mangareader.application.library.usecase;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.library.port.LibraryRepositoryPort;
import com.mangareader.application.library.service.LibraryVisibilityService;
import com.mangareader.application.library.service.LibraryAdultContentService;
import com.mangareader.domain.library.entity.SavedManga;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todos os mangás salvos na biblioteca do usuário.
 * <p>
 * DT-49: quando o viewer não é o dono, respeita {@code libraryVisibility}
 * (biblioteca privada ⇒ página vazia, mesmo contrato do perfil enriquecido).
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GetUserLibraryUseCase {
    private final LibraryRepositoryPort libraryRepository;
    private final LibraryVisibilityService libraryVisibilityService;
    private final LibraryAdultContentService adultContentService;

    public Page<SavedManga> execute(UUID userId, UUID viewerUserId, Pageable pageable) {
        if (!libraryVisibilityService.canView(userId, viewerUserId)) {
            return Page.empty(pageable);
        }

        if (adultContentService.mustFilter(viewerUserId)) {
            return adultContentService.filterAndPageForViewer(libraryRepository.findByUserId(userId), viewerUserId, pageable);
        }
        return adultContentService.enrichPage(libraryRepository.findByUserId(userId, pageable));
    }
}
