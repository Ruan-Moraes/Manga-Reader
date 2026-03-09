package com.mangareader.infrastructure.persistence.postgres.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;
import com.mangareader.infrastructure.persistence.postgres.repository.TagJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port {@link TagRepositoryPort} ao Spring Data JPA.
 */
@Component
@RequiredArgsConstructor
public class TagRepositoryAdapter implements TagRepositoryPort {

    private final TagJpaRepository jpaRepository;

    @Override
    public List<Tag> findAll() {
        return jpaRepository.findAllByOrderByLabelAsc();
    }

    @Override
    public Optional<Tag> findById(Long id) {
        return jpaRepository.findById(id);
    }

    @Override
    public List<Tag> findByLabelContainingIgnoreCase(String query) {
        return jpaRepository.findByLabelContainingIgnoreCase(query);
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
        return jpaRepository.findAll(pageable);
    }

    @Override
    public Page<Tag> findByLabelContainingIgnoreCase(String query, Pageable pageable) {
        return jpaRepository.findByLabelContainingIgnoreCase(query, pageable);
    }
}
