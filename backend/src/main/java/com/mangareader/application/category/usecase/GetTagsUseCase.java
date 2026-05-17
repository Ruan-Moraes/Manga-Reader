package com.mangareader.application.category.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todas as tags ordenadas alfabeticamente.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class GetTagsUseCase {
    private final TagRepositoryPort tagRepository;

    public Page<Tag> execute(Pageable pageable) {
        return tagRepository.findAll(pageable);
    }
}
