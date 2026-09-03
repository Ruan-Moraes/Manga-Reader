package com.mangareader.application.manga.port;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.mangareader.domain.manga.entity.Chapter;
import com.mangareader.domain.manga.valueobject.ChapterStatus;

/**
 * Port de saída — acesso a dados de Chapters (MongoDB, coleção própria).
 */
public interface ChapterRepositoryPort {
    Page<Chapter> findByTitleId(String titleId, Pageable pageable);

    Optional<Chapter> findByTitleIdAndNumber(String titleId, String number);
    Optional<Chapter> findAnyByTitleIdAndNumber(String titleId, String number);

    long countByTitleId(String titleId);

    /**
     * Contagem de capítulos por título em UMA query (agregação) para uma
     * página de títulos — evita N+1 em listagens admin. Títulos sem
     * capítulos não aparecem no mapa (consumidor usa default 0).
     */
    Map<String, Long> countByTitleIdIn(Collection<String> titleIds);

    /**
     * Maior número de capítulo (string original) por título, em UMA query
     * (agregação) para uma página de títulos — evita N+1 em listagens.
     * Números não-numéricos só vencem se forem os únicos do título.
     * Títulos sem capítulos não aparecem no mapa.
     */
    Map<String, String> latestChapterNumberByTitleIdIn(Collection<String> titleIds);

    long count();

    List<Chapter> saveAll(List<Chapter> chapters);

    List<Chapter> findScheduledBefore(Instant instant);

    List<Chapter> findActiveByTitleId(String titleId);

    void deleteByTitleId(String titleId);

    Optional<Chapter> findById(String id);
    Chapter save(Chapter chapter);
    boolean existsActiveByTitleIdAndNumber(String titleId, String number, String excludeId);
    Page<Chapter> findAdmin(String titleId, List<ChapterStatus> statuses, String search,
            Instant publishedFrom, Instant publishedTo, boolean includeDeleted, Pageable pageable);
}
