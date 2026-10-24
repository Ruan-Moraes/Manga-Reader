package com.toonlira.application.search;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.toonlira.application.author.port.AuthorRepositoryPort;
import com.toonlira.application.author.port.TitleAuthorRepositoryPort;
import com.toonlira.application.group.port.GroupRepositoryPort;
import com.toonlira.application.manga.port.TitleRepositoryPort;
import com.toonlira.application.manga.service.AdultContentAccessPolicy;
import com.toonlira.application.manga.usecase.SearchTitlesUseCase;
import com.toonlira.application.publisher.port.PublisherRepositoryPort;
import com.toonlira.application.publisher.port.TitlePublisherRepositoryPort;
import com.toonlira.domain.author.entity.Author;
import com.toonlira.domain.author.entity.AuthorAlias;
import com.toonlira.domain.author.entity.TitleAuthor;
import com.toonlira.domain.author.valueobject.AuthorAliasType;
import com.toonlira.domain.author.valueobject.AuthorRole;
import com.toonlira.domain.group.entity.Group;
import com.toonlira.domain.manga.entity.Title;
import com.toonlira.domain.manga.valueobject.TitleAlias;
import com.toonlira.domain.manga.valueobject.TitleSearchMatchType;
import com.toonlira.domain.publisher.entity.Publisher;
import com.toonlira.domain.publisher.entity.PublisherAlias;
import com.toonlira.domain.publisher.entity.TitlePublisher;
import com.toonlira.domain.publisher.valueobject.PublisherAliasType;
import com.toonlira.domain.search.valueobject.GlobalSearchEntityType;
import com.toonlira.domain.search.valueobject.GlobalSearchMatchType;
import com.toonlira.shared.application.i18n.LocaleResolutionService;
import com.toonlira.shared.domain.SearchText;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GlobalSearchUseCase {
    private static final Set<AuthorRole> AUTHOR_ROLES = Set.of(AuthorRole.AUTHOR, AuthorRole.STORY);
    private static final Comparator<GlobalSearchSection> SECTION_ORDER =
            Comparator.comparingInt(GlobalSearchSection::bestRank)
                    .thenComparingInt(section -> section.type().ordinal());

    private final SearchTitlesUseCase searchTitlesUseCase;
    private final AuthorRepositoryPort authorRepository;
    private final TitleAuthorRepositoryPort titleAuthorRepository;
    private final PublisherRepositoryPort publisherRepository;
    private final TitlePublisherRepositoryPort titlePublisherRepository;
    private final GroupRepositoryPort groupRepository;
    private final TitleRepositoryPort titleRepository;
    private final AdultContentAccessPolicy adultContentAccessPolicy;
    private final LocaleResolutionService localeResolutionService;

    @Transactional(readOnly = true)
    public Page<GlobalSearchResult> search(
            String query,
            GlobalSearchEntityType type,
            Pageable pageable,
            UUID userId) {
        var normalized = normalizedQuery(query);
        var excludeAdult = adultContentAccessPolicy.mustExcludeAdult(userId);

        return switch (type) {
            case TITLE -> searchTitles(normalized, pageable, userId);
            case AUTHOR -> searchPeople(normalized, false, false, pageable, excludeAdult);
            case ARTIST -> searchPeople(normalized, true, false, pageable, excludeAdult);
            case PUBLISHER -> searchPublishers(normalized, pageable, excludeAdult);
            case GROUP -> searchGroups(normalized, pageable, excludeAdult);
        };
    }

    @Transactional(readOnly = true)
    public GlobalSearchSuggestions suggestions(String query, int limitPerType, UUID userId) {
        var normalized = normalizedQuery(query);
        var excludeAdult = adultContentAccessPolicy.mustExcludeAdult(userId);
        var firstPage = PageRequest.of(0, limitPerType);

        var sections = new ArrayList<GlobalSearchSection>();
        addSection(sections, GlobalSearchEntityType.TITLE,
                searchTitles(normalized, firstPage, userId));
        addSection(sections, GlobalSearchEntityType.AUTHOR,
                searchPeople(normalized, false, false, firstPage, excludeAdult));
        addSection(sections, GlobalSearchEntityType.ARTIST,
                searchPeople(normalized, true, true, firstPage, excludeAdult));
        addSection(sections, GlobalSearchEntityType.PUBLISHER,
                searchPublishers(normalized, firstPage, excludeAdult));
        addSection(sections, GlobalSearchEntityType.GROUP,
                searchGroups(normalized, firstPage, excludeAdult));
        sections.sort(SECTION_ORDER);

        return new GlobalSearchSuggestions(
                List.copyOf(sections),
                sections.stream().mapToLong(GlobalSearchSection::totalElements).sum());
    }

    private Page<GlobalSearchResult> searchTitles(
            String normalized, Pageable pageable, UUID userId) {
        var hits = searchTitlesUseCase.execute(normalized, pageable, userId);
        var titleIds = hits.getContent().stream().map(hit -> hit.title().getId()).toList();
        var contributors = titleAuthorRepository.findByTitleIdIn(titleIds).stream()
                .collect(Collectors.groupingBy(TitleAuthor::getTitleId));

        return hits.map(hit -> {
            var title = hit.title();
            var name = localeResolutionService.resolve(title.getName());
            var match = titleMatch(title, hit.matchedBy(), hit.matchedText(), normalized);
            var primaryContributor = contributors
                    .getOrDefault(title.getId(), List.of()).stream()
                    .sorted(Comparator.comparingInt(credit ->
                            AUTHOR_ROLES.contains(credit.getRole()) ? 0 : 1))
                    .map(credit -> credit.getAuthor().getName())
                    .findFirst()
                    .orElse(null);

            return new GlobalSearchResult(
                    title.getId(), null, GlobalSearchEntityType.TITLE,
                    name, title.getCover(), match.type(), hit.matchedText(),
                    List.of(), 0, title.getType(), title.getStatus(), title.isAdult(),
                    primaryContributor, null, match.rank());
        });
    }

    private Page<GlobalSearchResult> searchPeople(
            String normalized,
            boolean artist,
            boolean excludeAuthors,
            Pageable pageable,
            boolean excludeAdult) {
        Page<Author> page = artist
                ? authorRepository.searchCatalogArtists(normalized, excludeAuthors, pageable)
                : authorRepository.searchCatalogAuthors(normalized, pageable);
        var ids = page.getContent().stream().map(Author::getId).toList();
        var aliases = authorRepository.findAliasesByAuthorIds(ids).stream()
                .collect(Collectors.groupingBy(alias -> alias.getAuthor().getId()));
        var credits = titleAuthorRepository.findByAuthorIdIn(ids).stream()
                .collect(Collectors.groupingBy(credit -> credit.getAuthor().getId()));
        var visibleIds = visibleIds(credits.values().stream()
                .flatMap(Collection::stream).map(TitleAuthor::getTitleId).toList(), excludeAdult);

        return page.map(author -> {
            var authorCredits = credits.getOrDefault(author.getId(), List.of());
            var roles = authorCredits.stream()
                    .map(TitleAuthor::getRole)
                    .distinct()
                    .sorted(Comparator.comparingInt(Enum::ordinal))
                    .map(Enum::name)
                    .toList();
            var workCount = authorCredits.stream()
                    .map(TitleAuthor::getTitleId)
                    .filter(visibleIds::contains)
                    .distinct()
                    .count();
            var match = personMatch(author, aliases.getOrDefault(author.getId(), List.of()), normalized);

            return new GlobalSearchResult(
                    author.getId().toString(), author.getSlug(),
                    artist ? GlobalSearchEntityType.ARTIST : GlobalSearchEntityType.AUTHOR,
                    author.getName(), author.getImageUrl(), match.type(), match.text(),
                    roles, workCount, null, null, null, null,
                    author.getNationality(), match.rank());
        });
    }

    private Page<GlobalSearchResult> searchPublishers(
            String normalized, Pageable pageable, boolean excludeAdult) {
        Page<Publisher> page = publisherRepository.searchCatalog(normalized, pageable);
        var ids = page.getContent().stream().map(Publisher::getId).toList();
        var aliases = publisherRepository.findAliasesByPublisherIds(ids).stream()
                .collect(Collectors.groupingBy(alias -> alias.getPublisher().getId()));
        var relations = titlePublisherRepository.findByPublisherIdIn(ids).stream()
                .collect(Collectors.groupingBy(relation -> relation.getPublisher().getId()));
        var visibleIds = visibleIds(relations.values().stream()
                .flatMap(Collection::stream).map(TitlePublisher::getTitleId).toList(), excludeAdult);

        return page.map(publisher -> {
            var publisherRelations = relations.getOrDefault(publisher.getId(), List.of());
            var workCount = publisherRelations.stream()
                    .map(TitlePublisher::getTitleId)
                    .filter(visibleIds::contains)
                    .distinct()
                    .count();
            var match = publisherMatch(
                    publisher, aliases.getOrDefault(publisher.getId(), List.of()), normalized);

            return new GlobalSearchResult(
                    publisher.getId().toString(), publisher.getSlug(),
                    GlobalSearchEntityType.PUBLISHER, publisher.getName(),
                    publisher.getLogoUrl(), match.type(), match.text(), List.of(),
                    workCount, null, null, null, null, publisher.getCountry(), match.rank());
        });
    }

    private Page<GlobalSearchResult> searchGroups(
            String normalized, Pageable pageable, boolean excludeAdult) {
        Page<Group> page = groupRepository.searchCatalog(normalized, pageable);
        var ids = page.getContent().stream().map(Group::getId).toList();
        var references = groupRepository.findWorkTitleIdsByGroupIds(ids);
        var visibleIds = visibleIds(
                references.stream().map(reference -> reference.titleId()).toList(),
                excludeAdult);
        var titleIdsByGroup = references.stream()
                .collect(Collectors.groupingBy(
                        reference -> reference.groupId(),
                        Collectors.mapping(reference -> reference.titleId(), Collectors.toSet())));

        return page.map(group -> {
            var name = localeResolutionService.resolve(group.getName());
            var normalizedName = SearchText.normalize(name);
            var usernameMatch = !normalizedName.contains(normalized)
                    && SearchText.normalize(group.getUsername()).contains(normalized);
            var rank = rank(usernameMatch ? group.getUsername() : name, normalized);
            var workCount = titleIdsByGroup.getOrDefault(group.getId(), Set.of()).stream()
                    .filter(visibleIds::contains)
                    .count();

            return new GlobalSearchResult(
                    group.getId().toString(), group.getUsername(),
                    GlobalSearchEntityType.GROUP, name, group.getLogo(),
                    usernameMatch ? GlobalSearchMatchType.USERNAME
                            : GlobalSearchMatchType.PRIMARY_NAME,
                    usernameMatch ? group.getUsername() : name,
                    List.of(), workCount, null, group.getStatus().name(), null,
                    null, null, rank);
        });
    }

    private Set<String> visibleIds(Collection<String> ids, boolean excludeAdult) {
        return new HashSet<>(titleRepository.findVisibleIds(ids, excludeAdult));
    }

    private static Match personMatch(
            Author author, List<AuthorAlias> aliases, String normalized) {
        var primaryRank = rank(author.getName(), normalized);
        if (primaryRank < 3) {
            return new Match(GlobalSearchMatchType.PRIMARY_NAME, author.getName(), primaryRank);
        }
        var alias = bestAlias(aliases, AuthorAlias::getName, normalized);
        if (alias == null) {
            return new Match(GlobalSearchMatchType.PRIMARY_NAME, author.getName(), primaryRank);
        }
        return new Match(
                alias.getType() == AuthorAliasType.PEN_NAME
                        ? GlobalSearchMatchType.PEN_NAME
                        : GlobalSearchMatchType.ALTERNATE_NAME,
                alias.getName(), 3);
    }

    private static Match publisherMatch(
            Publisher publisher, List<PublisherAlias> aliases, String normalized) {
        var primaryRank = rank(publisher.getName(), normalized);
        if (primaryRank < 3) {
            return new Match(GlobalSearchMatchType.PRIMARY_NAME, publisher.getName(), primaryRank);
        }
        var alias = bestAlias(aliases, PublisherAlias::getName, normalized);
        if (alias == null) {
            return new Match(
                    GlobalSearchMatchType.PRIMARY_NAME, publisher.getName(), primaryRank);
        }
        var type = switch (alias.getType()) {
            case ABBREVIATION -> GlobalSearchMatchType.ABBREVIATION;
            case ORIGINAL -> GlobalSearchMatchType.ORIGINAL_NAME;
            case ALTERNATE -> GlobalSearchMatchType.ALTERNATE_NAME;
        };
        return new Match(type, alias.getName(), 3);
    }

    private static Match titleMatch(
            Title title,
            TitleSearchMatchType matchedBy,
            String matchedText,
            String normalized) {
        if (matchedBy == TitleSearchMatchType.TITLE) {
            return new Match(GlobalSearchMatchType.PRIMARY_NAME, matchedText,
                    rank(matchedText, normalized));
        }
        if (matchedBy == TitleSearchMatchType.ALTERNATE_TITLE) {
            var aliasMatch = title.getAliases().stream()
                    .filter(alias -> alias.getName() != null
                            && SearchText.normalize(alias.getName()).contains(normalized))
                    .findFirst();
            return new Match(
                    aliasMatch.isPresent()
                            ? GlobalSearchMatchType.ALTERNATE_NAME
                            : GlobalSearchMatchType.TRANSLATED_TITLE,
                    matchedText, 3);
        }
        return new Match(switch (matchedBy) {
            case AUTHOR -> GlobalSearchMatchType.RELATED_AUTHOR;
            case ARTIST -> GlobalSearchMatchType.RELATED_ARTIST;
            case PUBLISHER -> GlobalSearchMatchType.RELATED_PUBLISHER;
            case GROUP -> GlobalSearchMatchType.RELATED_GROUP;
            default -> GlobalSearchMatchType.PRIMARY_NAME;
        }, matchedText, 4);
    }

    private static int rank(String value, String normalized) {
        var candidate = SearchText.normalize(value);
        if (candidate.equals(normalized)) return 0;
        if (candidate.startsWith(normalized)) return 1;
        if (candidate.contains(normalized)) return 2;
        return 3;
    }

    private static <T> T bestAlias(
            List<T> aliases, Function<T, String> name, String normalized) {
        return aliases.stream()
                .filter(alias -> SearchText.normalize(name.apply(alias)).contains(normalized))
                .min(Comparator.comparingInt(alias -> rank(name.apply(alias), normalized)))
                .orElse(null);
    }

    private static String normalizedQuery(String query) {
        SearchText.requireValid(query);
        return SearchText.normalize(query);
    }

    private static void addSection(
            List<GlobalSearchSection> sections,
            GlobalSearchEntityType type,
            Page<GlobalSearchResult> page) {
        if (!page.isEmpty()) {
            sections.add(new GlobalSearchSection(type, page.getTotalElements(), page.getContent()));
        }
    }

    private record Match(GlobalSearchMatchType type, String text, int rank) {
    }
}
