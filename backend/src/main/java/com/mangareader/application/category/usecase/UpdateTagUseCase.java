package com.mangareader.application.category.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza o label de uma tag existente.
 */
@Service
@RequiredArgsConstructor
public class UpdateTagUseCase {
    private final TagRepositoryPort tagRepository;

    @Transactional
    public Tag execute(Long id, String newLabel) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", "id", id.toString()));

        String trimmed = newLabel.trim();

        tagRepository.findByLabelIgnoreCase(trimmed).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalStateException("Tag com label duplicada: " + trimmed);
            }
        });

        tag.setLabel(trimmed);

        return tagRepository.save(tag);
    }
}
