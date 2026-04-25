package com.mangareader.application.category.usecase;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;

import lombok.RequiredArgsConstructor;

/**
 * Cria uma nova tag. Valida label não-branco e unicidade.
 */
@Service
@RequiredArgsConstructor
public class CreateTagUseCase {

    private final TagRepositoryPort tagRepository;

    @Transactional
    public Tag execute(String label) {
        if (label == null || label.isBlank()) {
            throw new IllegalArgumentException("Label da tag não pode estar em branco");
        }

        String trimmed = label.trim();

        tagRepository.findByLabelIgnoreCase(trimmed).ifPresent(existing -> {
            throw new IllegalStateException("Tag com label duplicada: " + trimmed);
        });

        Tag tag = Tag.builder().label(trimmed).build();
        
        return tagRepository.save(tag);
    }
}
