package com.mangareader.application.category.usecase;

import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;
import com.mangareader.shared.domain.i18n.LocalizedString;
import com.mangareader.shared.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;

/**
 * Atualiza uma tag existente. Mapa BCP 47 → texto; pt-BR é fallback obrigatório.
 */
@Service
@RequiredArgsConstructor
public class UpdateTagUseCase {
    private final TagRepositoryPort tagRepository;

    @Transactional
    public Tag execute(Long id, Map<String, String> label) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", "id", id.toString()));

        String ptBR = resolvePtBR(label);
        String trimmed = ptBR.trim();

        tagRepository.findByLabelIgnoreCase(trimmed).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalStateException("Tag com label duplicada: " + trimmed);
            }
        });

        tag.setLabel(LocalizedString.of(label));

        return tagRepository.save(tag);
    }

    // Todo: Remover codigo duplicado: CreateTagUseCase e UpdateTagUseCase
    private String resolvePtBR(Map<String, String> label) {
        if (label == null) {
            throw new IllegalArgumentException("Label da tag não pode estar em branco");
        }

        String ptBR = label.get(LocalizedString.DEFAULT_TAG);

        if (ptBR == null || ptBR.isBlank()) {
            throw new IllegalArgumentException("Label da tag não pode estar em branco");
        }

        return ptBR;
    }
}
