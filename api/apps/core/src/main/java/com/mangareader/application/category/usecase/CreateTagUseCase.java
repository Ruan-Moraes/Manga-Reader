package com.mangareader.application.category.usecase;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.IntStream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.application.shared.port.CacheInvalidationPort;
import com.mangareader.domain.category.entity.Tag;
import com.mangareader.domain.category.entity.TagSlug;
import com.mangareader.shared.constant.CacheNames;
import com.mangareader.shared.domain.i18n.LocalizedString;

import lombok.RequiredArgsConstructor;

/**
 * Cria uma nova tag. Valida pt-BR não-branco e unicidade pelo slot pt-BR.
 * Gera o slug canônico (chave imutável) a partir do label en-US (fallback pt-BR).
 */
@Service
@RequiredArgsConstructor
public class CreateTagUseCase {
    private final TagRepositoryPort tagRepository;
    private final CacheInvalidationPort cacheInvalidation;

    @Transactional
    public Tag execute(Map<String, String> label) {
        String ptBR = resolvePtBR(label);
        String trimmed = ptBR.trim();

        tagRepository.findByLabelIgnoreCase(trimmed).ifPresent(existing -> {
            throw new IllegalStateException("Tag com label duplicada: " + trimmed);
        });

        Tag tag = Tag.builder()
                .slug(generateUniqueSlug(label))
                .label(LocalizedString.of(label))
                .build();

        Tag saved = tagRepository.save(tag);
        cacheInvalidation.evictAfterCommit(CacheNames.TAG, saved.getId());
        return saved;
    }

    private String generateUniqueSlug(Map<String, String> label) {
        String source = label.get("en-US");

        if (source == null || source.isBlank()) {
            source = label.get(LocalizedString.DEFAULT_TAG);
        }

        String base = TagSlug.canonical(source);

        List<String> candidates = java.util.stream.Stream.concat(
                java.util.stream.Stream.of(base),
                IntStream.rangeClosed(2, 99).mapToObj(i -> base + "_" + i)).toList();

        Set<String> taken = tagRepository.findExistingSlugs(candidates);

        return candidates.stream()
                .filter(c -> !taken.contains(c))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Não foi possível gerar slug único para: " + base));
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
