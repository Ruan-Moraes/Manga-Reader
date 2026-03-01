package com.mangareader.infrastructure.persistence.mongo.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.domain.manga.entity.Title;
import com.mangareader.infrastructure.persistence.mongo.repository.TitleMongoRepository;

import lombok.RequiredArgsConstructor;

/**
 * Adapter que conecta o port {@link TitleRepositoryPort} ao Spring Data MongoDB.
 */
@Component
@RequiredArgsConstructor
public class TitleRepositoryAdapter implements TitleRepositoryPort {

    private final TitleMongoRepository mongoRepository;

    @Override
    public List<Title> findAll() {
        return mongoRepository.findAll();
    }

    @Override
    public Optional<Title> findById(String id) {
        return mongoRepository.findById(id);
    }

    @Override
    public List<Title> findByGenresContaining(String genre) {
        return mongoRepository.findByGenresContaining(genre);
    }

    @Override
    public List<Title> searchByName(String query) {
        return mongoRepository.findByNameContainingIgnoreCase(query);
    }

    @Override
    public Title save(Title title) {
        return mongoRepository.save(title);
    }

    @Override
    public void deleteById(String id) {
        mongoRepository.deleteById(id);
    }
}
