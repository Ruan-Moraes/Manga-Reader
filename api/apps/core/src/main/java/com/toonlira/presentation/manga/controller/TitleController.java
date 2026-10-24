package com.toonlira.presentation.manga.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.toonlira.application.manga.port.TitleSearchHit;
import com.toonlira.application.manga.port.TitleRatingAggregateReadPort;
import com.toonlira.application.manga.port.TitleRatingAggregateReadPort.TitleRatingAggregateView;
import com.toonlira.application.manga.service.TitleAssociationReader;
import com.toonlira.application.manga.usecase.ChapterStats;
import com.toonlira.application.manga.usecase.FilterTitlesUseCase;
import com.toonlira.application.manga.usecase.GetChapterStatsUseCase;
import com.toonlira.application.manga.usecase.GetTitleByIdUseCase;
import com.toonlira.application.manga.usecase.GetTitlesByGenreUseCase;
import com.toonlira.application.manga.usecase.GetTitlesUseCase;
import com.toonlira.application.manga.usecase.SearchTitlesUseCase;
import com.toonlira.domain.category.valueobject.SortCriteria;
import com.toonlira.domain.manga.entity.Title;
import com.toonlira.domain.manga.valueobject.TitleSearchMatchType;
import com.toonlira.presentation.manga.dto.TitleAuthorResponse;
import com.toonlira.presentation.manga.dto.TitleResponse;
import com.toonlira.presentation.manga.dto.TitleSearchResultResponse;
import com.toonlira.presentation.manga.mapper.TitleMapper;
import com.toonlira.shared.dto.ApiResponse;
import com.toonlira.shared.dto.PageResponse;
import com.toonlira.shared.web.CurrentUserId;
import com.toonlira.shared.web.PageParams;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Controller de títulos de mangá.
 * <p>
 * Todos os endpoints são públicos (GET).
 */
@RestController
@RequestMapping("/api/titles")
@RequiredArgsConstructor
@Validated
@Tag(name = "Titles", description = "Catálogo de títulos de manga/manhwa/manhua")
public class TitleController {
    private final GetTitlesUseCase getTitlesUseCase;
    private final GetTitleByIdUseCase getTitleByIdUseCase;
    private final SearchTitlesUseCase searchTitlesUseCase;
    private final GetTitlesByGenreUseCase getTitlesByGenreUseCase;
    private final FilterTitlesUseCase filterTitlesUseCase;
    private final GetChapterStatsUseCase getChapterStatsUseCase;
    private final TitleRatingAggregateReadPort ratingAggregateReadPort;
    private final TitleAssociationReader titleAssociationReader;
    private final TitleMapper titleMapper;

    @GetMapping
    @Operation(summary = "Listar títulos", description = "Retorna todos os títulos do catálogo com paginação")
    public ResponseEntity<ApiResponse<PageResponse<TitleResponse>>> getAll(
            @PageParams(defaultSort = "name", defaultDirection = "asc")
            Pageable pageable,
            @CurrentUserId UUID userId
    ) {
        var result = getTitlesUseCase.execute(pageable, userId);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapWithStats(result))));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Buscar título por ID", description = "Retorna os detalhes de um título específico")
    public ResponseEntity<ApiResponse<TitleResponse>> getById(@PathVariable String id, @CurrentUserId UUID userId) {
        var title = getTitleByIdUseCase.execute(id, userId);

        var stats = getChapterStatsUseCase.execute(List.of(id))
                .getOrDefault(id, ChapterStats.EMPTY);

        var rating = ratingAggregateReadPort.findByTitleId(id).orElse(null);

        return ResponseEntity.ok(ApiResponse.success(titleMapper.toResponse(title, stats, rating)));
    }

    @GetMapping("/search")
    @Operation(summary = "Pesquisar títulos", description = "Busca obras por título localizado, autor, artista ou grupo")
    public ResponseEntity<ApiResponse<PageResponse<TitleSearchResultResponse>>> search(
            @RequestParam
            @NotBlank(message = "{validation.title.search.required}")
            @Size(min = 2, max = 100, message = "{validation.title.search.length}")
            String q,
            @PageParams(defaultSort = "name", defaultDirection = "asc",
                    ignoreRequestSort = true)
            Pageable pageable,
            @CurrentUserId UUID userId
    ) {
        var result = searchTitlesUseCase.execute(q, pageable, userId);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapSearchResults(result))));
    }

    @GetMapping("/genre/{genre}")
    @Operation(summary = "Filtrar por gênero", description = "Retorna títulos que contêm o gênero especificado")
    public ResponseEntity<ApiResponse<PageResponse<TitleResponse>>> getByGenre(
            @PathVariable String genre,
            @PageParams(defaultSort = "name", defaultDirection = "asc",
                    ignoreRequestSort = true)
            Pageable pageable,
            @CurrentUserId UUID userId
    ) {
        var result = getTitlesByGenreUseCase.execute(genre, pageable, userId);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapWithStats(result))));
    }

    @GetMapping("/filter")
    @Operation(summary = "Busca avançada", description = "Filtra títulos por gêneros, status, conteúdo adulto e critério de ordenação")
    public ResponseEntity<ApiResponse<PageResponse<TitleResponse>>> filter(
            @RequestParam(required = false) List<String> genres,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Boolean adult,
            @RequestParam(required = false) Long authorId,
            @RequestParam(required = false, defaultValue = "MOST_READ") String sort,
            @PageParams(defaultSort = "name", defaultDirection = "asc",
                    ignoreRequestSort = true)
            Pageable pageable,
            @CurrentUserId UUID userId
    ) {
        SortCriteria sortCriteria;

        try {
            sortCriteria = SortCriteria.valueOf(sort.toUpperCase());
        } catch (IllegalArgumentException e) {
            sortCriteria = SortCriteria.MOST_READ;
        }

        var result = filterTitlesUseCase.execute(genres, status, adult, authorId, sortCriteria, pageable, userId);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapWithStats(result))));
    }

    private Page<TitleResponse> mapWithStats(Page<Title> result) {
        var titleIds = result.getContent().stream().map(Title::getId).toList();

        var stats = getChapterStatsUseCase.execute(titleIds);
        Map<String, TitleRatingAggregateView> ratings = ratingAggregateReadPort.findByTitleIdIn(titleIds);
        var authorsByTitle = titleAssociationReader.authorsByTitle(titleIds);
        var publishersByTitle = titleAssociationReader.publishersByTitle(titleIds);

        return result.map(title -> titleMapper.toResponse(
                title,
                stats.getOrDefault(title.getId(), ChapterStats.EMPTY),
                ratings.get(title.getId()),
                authorsByTitle,
                publishersByTitle));
    }

    private Page<TitleSearchResultResponse> mapSearchResults(
            Page<TitleSearchHit> result) {
        var titleIds = result.getContent().stream().map(hit -> hit.title().getId()).toList();
        var stats = getChapterStatsUseCase.execute(titleIds);
        Map<String, TitleRatingAggregateView> ratings = ratingAggregateReadPort.findByTitleIdIn(titleIds);
        var authorsByTitle = titleAssociationReader.authorsByTitle(titleIds);
        var publishersByTitle = titleAssociationReader.publishersByTitle(titleIds);

        return result.map(hit -> {
            var titleId = hit.title().getId();
            var response = titleMapper.toResponse(
                    hit.title(),
                    stats.getOrDefault(titleId, ChapterStats.EMPTY),
                    ratings.get(titleId),
                    authorsByTitle,
                    publishersByTitle);
            var author = response.authors().stream()
                    .filter(item -> "AUTHOR".equals(item.role()))
                    .findFirst()
                    .or(() -> response.authors().stream().findFirst())
                    .map(TitleAuthorResponse::name)
                    .orElse(null);
            var alternateTitle = hit.matchedBy()
                    == TitleSearchMatchType.ALTERNATE_TITLE
                    && !hit.matchedText().equals(response.name())
                    ? hit.matchedText()
                    : null;

            return new TitleSearchResultResponse(
                    response.id(),
                    response.name(),
                    alternateTitle,
                    response.cover(),
                    response.type(),
                    response.status(),
                    response.chaptersCount(),
                    response.latestChapterNumber(),
                    response.adult(),
                    response.ratingAverage(),
                    response.ratingCount(),
                    author,
                    hit.matchedBy(),
                    hit.matchedText());
        });
    }
}
