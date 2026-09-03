package com.mangareader.application.author.usecase;

import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mangareader.application.author.port.AuthorRepositoryPort;
import com.mangareader.application.author.port.TitleAuthorRepositoryPort;
import com.mangareader.application.manga.port.TitleRepositoryPort;
import com.mangareader.application.manga.service.AdultContentAccessPolicy;
import com.mangareader.application.search.RelatedTitleResult;
import com.mangareader.shared.application.i18n.LocaleResolutionService;
import com.mangareader.shared.exception.ResourceNotFoundException;
import com.mangareader.domain.search.valueobject.GlobalSearchEntityType;
import com.mangareader.domain.author.valueobject.AuthorRole;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GetAuthorWorksUseCase {
    private final AuthorRepositoryPort authorRepository;
    private final TitleAuthorRepositoryPort titleAuthorRepository;
    private final TitleRepositoryPort titleRepository;
    private final AdultContentAccessPolicy adultContentAccessPolicy;
    private final LocaleResolutionService localeResolutionService;

    @Transactional(readOnly = true)
    public Page<RelatedTitleResult> execute(
            Long authorId, GlobalSearchEntityType kind, Pageable pageable, UUID userId) {
        authorRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("Author", "id", authorId));
        var credits = titleAuthorRepository.findByAuthorIdIn(java.util.List.of(authorId)).stream()
                .filter(credit -> matchesKind(credit.getRole(), kind))
                .toList();
        var titleIds = credits.stream().map(credit -> credit.getTitleId()).distinct().toList();
        var roles = credits.stream().collect(Collectors.groupingBy(
                credit -> credit.getTitleId(),
                Collectors.mapping(
                        credit -> credit.getRole().name(),
                        Collectors.collectingAndThen(Collectors.toSet(), java.util.List::copyOf))));

        return titleRepository.findVisibleByIds(
                        titleIds,
                        adultContentAccessPolicy.mustExcludeAdult(userId),
                        pageable)
                .map(title -> new RelatedTitleResult(
                        title.getId(), localeResolutionService.resolve(title.getName()),
                        title.getCover(), title.getType(), title.getStatus(), title.isAdult(),
                        roles.getOrDefault(title.getId(), java.util.List.of())));
    }

    private static boolean matchesKind(AuthorRole role, GlobalSearchEntityType kind) {
        if (kind == null) return true;
        if (kind == GlobalSearchEntityType.AUTHOR) {
            return role == AuthorRole.AUTHOR || role == AuthorRole.STORY;
        }
        if (kind == GlobalSearchEntityType.ARTIST) {
            return role == AuthorRole.ARTIST
                    || role == AuthorRole.COLORIST
                    || role == AuthorRole.LETTERER;
        }
        return true;
    }
}
