package com.mangareader.application.manga.usecase.admin;

import org.springframework.stereotype.Service;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Exclui um título (admin).
 */
@Service
@RequiredArgsConstructor
public class DeleteTitleUseCase {

    private final TitleRepositoryPort titleRepository;

    public void execute(String titleId) {
        titleRepository.findById(titleId)
                .orElseThrow(() -> new ResourceNotFoundException("Title", "id", titleId));

        titleRepository.deleteById(titleId);
    }
}
