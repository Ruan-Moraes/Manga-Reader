package com.mangareader.application.category.usecase;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;

import lombok.RequiredArgsConstructor;

/**
 * Busca tags cujo label contenha a query informada.
 */
@Service
@RequiredArgsConstructor
public class SearchTagsUseCase {

    private final TagRepositoryPort tagRepository;

    public List<Tag> execute(String query) {
        return tagRepository.findByLabelContainingIgnoreCase(query);
    }
}
