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
 * Atualiza uma tag existente. Aceita label legado (String) e/ou mapa
 * multilíngue {@code labelI18n}. pt-BR sempre derivado para campo legado.
 */
@Service
@RequiredArgsConstructor
public class UpdateTagUseCase {
    private final TagRepositoryPort tagRepository;

    @Transactional
    public Tag execute(Long id, String newLabel) {
        return execute(id, newLabel, null);
    }

    @Transactional
    public Tag execute(Long id, String newLabel, Map<String, String> labelI18n) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag", "id", id.toString()));

        String resolvedLabel = resolveLabel(newLabel, labelI18n);
        String trimmed = resolvedLabel.trim();

        tagRepository.findByLabelIgnoreCase(trimmed).ifPresent(existing -> {
            if (!existing.getId().equals(id)) {
                throw new IllegalStateException("Tag com label duplicada: " + trimmed);
            }
        });

        tag.setLabel(trimmed);

        if (labelI18n != null && !labelI18n.isEmpty()) {
            tag.setLabelI18n(LocalizedString.of(labelI18n));
        } else {
            tag.setLabelI18n(LocalizedString.ofDefault(trimmed));
        }

        return tagRepository.save(tag);
    }

    private String resolveLabel(String label, Map<String, String> labelI18n) {
        if (label != null && !label.isBlank()) {
            return label;
        }

        if (labelI18n != null) {
            String ptBR = labelI18n.get(LocalizedString.DEFAULT_TAG);

            if (ptBR != null && !ptBR.isBlank()) {
                return ptBR;
            }
        }

        throw new IllegalArgumentException("Label da tag não pode estar em branco");
    }
}
