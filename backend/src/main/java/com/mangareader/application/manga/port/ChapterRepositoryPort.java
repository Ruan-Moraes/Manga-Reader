package com.mangareader.application.manga.port;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.manga.entity.Chapter;

/**
 * Port de saída — acesso a dados de Chapters (MongoDB, coleção própria).
 */
public interface ChapterRepositoryPort {
    Page<Chapter> findByTitleId(String titleId, Pageable pageable);

    Optional<Chapter> findByTitleIdAndNumber(String titleId, String number);

    long countByTitleId(String titleId);

    /**
     * Contagem de capítulos por título em UMA query (agregação) para uma
     * página de títulos — evita N+1 em listagens admin. Títulos sem
     * capítulos não aparecem no mapa (consumidor usa default 0).
     */
    Map<String, Long> countByTitleIdIn(Collection<String> titleIds);

    long count();

    List<Chapter> saveAll(List<Chapter> chapters);

    void deleteByTitleId(String titleId);
}
