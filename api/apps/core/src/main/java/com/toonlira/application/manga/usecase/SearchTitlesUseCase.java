package com.toonlira.application.manga.usecase;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.author.port.TitleAuthorRepositoryPort;
import com.toonlira.application.group.port.GroupRepositoryPort;
import com.toonlira.application.manga.port.TitleRepositoryPort;
import com.toonlira.application.manga.port.TitleReferenceMatch;
import com.toonlira.application.manga.port.TitleSearchHit;
import com.toonlira.application.publisher.port.TitlePublisherRepositoryPort;
import com.toonlira.application.manga.service.AdultContentAccessPolicy;
import com.toonlira.application.manga.service.TitleSearchText;
import com.toonlira.shared.application.i18n.LocaleResolutionService;
import java.util.UUID;
import java.util.LinkedHashMap;
import java.util.Comparator;

import lombok.RequiredArgsConstructor;

/**
 * Busca global por título localizado, autor/artista e grupo.
 */
@Service
@RequiredArgsConstructor
public class SearchTitlesUseCase {
    private final TitleRepositoryPort titleRepository;
    private final TitleAuthorRepositoryPort titleAuthorRepository;
    private final GroupRepositoryPort groupRepository;
    private final TitlePublisherRepositoryPort titlePublisherRepository;
    private final AdultContentAccessPolicy adultContentAccessPolicy;
    private final LocaleResolutionService localeResolutionService;

    @Transactional(readOnly = true)
    public Page<TitleSearchHit> execute(String query, Pageable pageable) {
        return execute(query, pageable, null);
    }

    @Transactional(readOnly = true)
    public Page<TitleSearchHit> execute(String query, Pageable pageable, UUID userId) {
        var collapsed = TitleSearchText.collapseSpaces(query);
        var normalized = TitleSearchText.normalize(collapsed);
        if (normalized.length() < TitleSearchText.MIN_LENGTH
                || normalized.length() > TitleSearchText.MAX_LENGTH) {
            throw new IllegalArgumentException("Search query must contain between 2 and 100 characters");
        }

        var matches = new LinkedHashMap<String, TitleReferenceMatch>();
        titleAuthorRepository.searchTitleReferences(normalized).stream()
                .sorted(Comparator.comparingInt(match -> match.type().ordinal()))
                .forEach(match -> matches.putIfAbsent(match.titleId(), match));
        groupRepository.searchTitleReferences(normalized)
                .forEach(match -> matches.putIfAbsent(match.titleId(), match));
        titlePublisherRepository.searchTitleReferences(normalized)
                .forEach(match -> matches.putIfAbsent(match.titleId(), match));

        return titleRepository.searchGlobal(
                normalized,
                localeResolutionService.currentContentLanguageTags(),
                matches,
                adultContentAccessPolicy.mustExcludeAdult(userId),
                pageable);
    }
}
