package com.mangareader.application.category.usecase;

import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;
import com.mangareader.shared.domain.i18n.LocalizedString;

import lombok.RequiredArgsConstructor;

/**
 * Cria uma nova tag. Valida label não-branco e unicidade.
 *
 * <p>Aceita label legado (String) e/ou mapa multilíngue {@code labelI18n}.
 * pt-BR é fallback obrigatório — se mapa presente, deve conter pt-BR.
 */
@Service
@RequiredArgsConstructor
public class CreateTagUseCase {

    private final TagRepositoryPort tagRepository;

    @Transactional
    public Tag execute(String label) {
        return execute(label, null);
    }

    @Transactional
    public Tag execute(String label, Map<String, String> labelI18n) {
        String resolvedLabel = resolveLabel(label, labelI18n);
        String trimmed = resolvedLabel.trim();

        tagRepository.findByLabelIgnoreCase(trimmed).ifPresent(existing -> {
            throw new IllegalStateException("Tag com label duplicada: " + trimmed);
        });

        LocalizedString i18n = (labelI18n != null && !labelI18n.isEmpty())
                ? LocalizedString.of(labelI18n)
                : LocalizedString.ofDefault(trimmed);

        Tag tag = Tag.builder()
                .label(trimmed)
                .labelI18n(i18n)
                .build();

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
