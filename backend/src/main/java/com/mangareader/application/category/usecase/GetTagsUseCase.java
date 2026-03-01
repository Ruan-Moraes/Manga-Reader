package com.mangareader.application.category.usecase;

import java.util.List;

import org.springframework.stereotype.Service;

import com.mangareader.application.category.port.TagRepositoryPort;
import com.mangareader.domain.category.entity.Tag;

import lombok.RequiredArgsConstructor;

/**
 * Retorna todas as tags ordenadas alfabeticamente.
 */
@Service
@RequiredArgsConstructor
public class GetTagsUseCase {

    private final TagRepositoryPort tagRepository;

    public List<Tag> execute() {
        return tagRepository.findAll();
    }
}
