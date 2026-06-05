package com.mangareader.application.category.usecase;

import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;
import com.mangareader.shared.domain.i18n.LocalizedString;

import lombok.RequiredArgsConstructor;

/**
 * Cria uma nova tag. Valida pt-BR não-branco e unicidade pelo slot pt-BR.
 */
@Service
@RequiredArgsConstructor
public class CreateTagUseCase {

    private final TagRepositoryPort tagRepository;

    @Transactional
    public Tag execute(Map<String, String> label) {
        String ptBR = resolvePtBR(label);
        String trimmed = ptBR.trim();

        tagRepository.findByLabelIgnoreCase(trimmed).ifPresent(existing -> {
            throw new IllegalStateException("Tag com label duplicada: " + trimmed);
        });

        Tag tag = Tag.builder()
                .label(LocalizedString.of(label))
                .build();

        return tagRepository.save(tag);
    }

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
