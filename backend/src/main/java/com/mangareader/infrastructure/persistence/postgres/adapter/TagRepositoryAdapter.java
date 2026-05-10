package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;
import com.mangareader.infrastructure.persistence.postgres.repository.TagJpaRepository;
import com.mangareader.shared.domain.i18n.LocalizedString;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port {@link TagRepositoryPort} ao Spring Data JPA.
 *
 * <p>Pós-Fase B i18n: {@code label} é JSONB. Filtros / ordenação / busca
 * são feitos em memória (cardinalidade baixa).
 */
@Component
@RequiredArgsConstructor
public class TagRepositoryAdapter implements TagRepositoryPort {
    private final TagJpaRepository jpaRepository;

    @Override
    public List<Tag> findAll() {
        return sortedByDefaultLabel(jpaRepository.findAll());
    }

    @Override
    public Optional<Tag> findById(Long id) {
        return jpaRepository.findById(id);
    }

    @Override
    public Optional<Tag> findByLabelIgnoreCase(String label) {
        if (label == null) {
            return Optional.empty();
        }
        return jpaRepository.findAll().stream()
                .filter(t -> defaultLabel(t).equalsIgnoreCase(label))
                .findFirst();
    }

    @Override
    public List<Tag> findByLabelContainingIgnoreCase(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        var lower = query.toLowerCase();
        return sortedByDefaultLabel(jpaRepository.findAll().stream()
                .filter(t -> matchesAnyLocale(t, lower))
                .toList());
    }

    @Override
    public Tag save(Tag tag) {
        return jpaRepository.save(tag);
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public Page<Tag> findAll(Pageable pageable) {
        var all = sortedByDefaultLabel(jpaRepository.findAll());
        return slice(all, pageable);
    }

    @Override
    public Page<Tag> findByLabelContainingIgnoreCase(String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return Page.empty(pageable);
        }
        var lower = query.toLowerCase();
        var filtered = sortedByDefaultLabel(jpaRepository.findAll().stream()
                .filter(t -> matchesAnyLocale(t, lower))
                .toList());
        return slice(filtered, pageable);
    }

    private static String defaultLabel(Tag tag) {
        var label = tag.getLabel();
        if (label == null) {
            return "";
        }
        var pt = label.values().get(LocalizedString.DEFAULT_TAG);
        if (pt != null && !pt.isBlank()) {
            return pt;
        }
        return label.values().values().stream()
                .filter(v -> v != null && !v.isBlank())
                .findFirst()
                .orElse("");
    }

    private static boolean matchesAnyLocale(Tag tag, String lowerQuery) {
        var label = tag.getLabel();
        if (label == null) {
            return false;
        }
        return label.values().values().stream()
                .anyMatch(v -> v != null && v.toLowerCase().contains(lowerQuery));
    }

    private static List<Tag> sortedByDefaultLabel(List<Tag> tags) {
        return tags.stream()
                .sorted(Comparator.comparing(TagRepositoryAdapter::defaultLabel,
                        String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private static Page<Tag> slice(List<Tag> all, Pageable pageable) {
        if (pageable.isUnpaged()) {
            return new PageImpl<>(all, pageable, all.size());
        }
        int from = (int) Math.min(pageable.getOffset(), all.size());
        int to = Math.min(from + pageable.getPageSize(), all.size());
        return new PageImpl<>(all.subList(from, to), pageable, all.size());
    }
}
