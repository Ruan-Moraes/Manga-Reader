package com.mangareader.application.manga.usecase.admin;

import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Busca administrativa de um título por ID (entidade crua, sem resolução de
 * locale — o mapper admin expõe todos os idiomas).
 */
@Service
@RequiredArgsConstructor
public class GetAdminTitleUseCase {
    private final TitleRepositoryPort titleRepository;

    public Title execute(String id) {
        return titleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Title", "id", id));
    }
}
