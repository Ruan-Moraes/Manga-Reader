package com.mangareader.presentation.publisher.controller;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.publisher.usecase.GetPublisherUseCase;
import com.mangareader.application.publisher.usecase.GetPublisherWorksUseCase;
import com.mangareader.presentation.search.dto.RelatedTitleResponse;
import com.mangareader.presentation.search.mapper.RelatedTitleMapper;
import com.mangareader.shared.web.CurrentUserId;
import com.mangareader.shared.web.PageParams;
import java.util.UUID;
import com.mangareader.application.publisher.usecase.ListPublishersUseCase;
import com.mangareader.presentation.publisher.dto.PublisherResponse;
import com.mangareader.presentation.publisher.mapper.PublisherMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

import lombok.RequiredArgsConstructor;

/**
 * Endpoints REST públicos para editoras.
 */
@RestController
@RequestMapping("/api/publishers")
@RequiredArgsConstructor
public class PublisherController {
    private final ListPublishersUseCase listPublishersUseCase;
    private final GetPublisherUseCase getPublisherUseCase;
    private final GetPublisherWorksUseCase getPublisherWorksUseCase;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PublisherResponse>>> list(
            @RequestParam(required = false) String name,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "name"));

        var result = listPublishersUseCase.execute(name, pageable);
        var mapped = result.map(PublisherMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PublisherResponse>> getById(@PathVariable Long id) {
        var publisher = getPublisherUseCase.execute(id);

        return ResponseEntity.ok(ApiResponse.success(PublisherMapper.toResponse(publisher)));
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<ApiResponse<PublisherResponse>> getBySlug(
            @PathVariable String slug) {
        return ResponseEntity.ok(ApiResponse.success(
                PublisherMapper.toResponse(getPublisherUseCase.executeBySlug(slug))));
    }

    @GetMapping("/{id}/works")
    public ResponseEntity<ApiResponse<PageResponse<RelatedTitleResponse>>> getWorks(
            @PathVariable Long id,
            @PageParams(defaultSort = "name", defaultDirection = "asc",
                    ignoreRequestSort = true)
            Pageable pageable,
            @CurrentUserId UUID userId) {
        var result = getPublisherWorksUseCase.execute(id, pageable, userId)
                .map(RelatedTitleMapper::toResponse);
        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(result)));
    }
}
