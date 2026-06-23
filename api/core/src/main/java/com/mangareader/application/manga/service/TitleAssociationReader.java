package com.mangareader.application.manga.service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.mangareader.application.author.port.TitleAuthorRepositoryPort;
import com.mangareader.application.publisher.port.TitlePublisherRepositoryPort;
import com.mangareader.domain.author.entity.TitleAuthor;
import com.mangareader.domain.publisher.entity.TitlePublisher;

import lombok.RequiredArgsConstructor;

/**
 * Carrega em lote as junções relacionais de vários títulos, evitando N+1 ao montar
 * respostas de listagem (DT-52). Cada mapa é indexado por {@code titleId}; títulos
 * sem junções simplesmente não aparecem no mapa.
 */
@Service
@RequiredArgsConstructor
public class TitleAssociationReader {
    private final TitleAuthorRepositoryPort titleAuthorRepository;
    private final TitlePublisherRepositoryPort titlePublisherRepository;

    public Map<String, List<TitleAuthor>> authorsByTitle(Collection<String> titleIds) {
        return titleAuthorRepository.findByTitleIdIn(titleIds).stream()
                .collect(Collectors.groupingBy(TitleAuthor::getTitleId));
    }

    public Map<String, List<TitlePublisher>> publishersByTitle(Collection<String> titleIds) {
        return titlePublisherRepository.findByTitleIdIn(titleIds).stream()
                .collect(Collectors.groupingBy(TitlePublisher::getTitleId));
    }
}
