package com.mangareader.presentation.library.controller;

import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import com.mangareader.shared.web.CurrentUserId;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.library.usecase.ChangeReadingListUseCase;
import com.mangareader.application.library.usecase.GetLibraryCountsUseCase;
import com.mangareader.application.library.usecase.GetUserLibraryByListUseCase;
import com.mangareader.application.library.usecase.GetUserLibraryUseCase;
import com.mangareader.application.library.usecase.RemoveFromLibraryUseCase;
import com.mangareader.application.library.usecase.SaveToLibraryUseCase;
import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.presentation.library.dto.ChangeListRequest;
import com.mangareader.presentation.library.dto.LibraryCountsResponse;
import com.mangareader.presentation.library.dto.SaveToLibraryRequest;
import com.mangareader.presentation.library.dto.SavedMangaResponse;
import com.mangareader.presentation.library.mapper.LibraryMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;
import com.mangareader.shared.web.PageParams;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller da biblioteca do usuário.
 * <p>
 * Todos os endpoints requerem autenticação.
 */
@RestController
@RequestMapping("/api/library")
@RequiredArgsConstructor
@Tag(name = "Library", description = "Biblioteca pessoal do usuário")
public class LibraryController {
    private final GetUserLibraryUseCase getUserLibraryUseCase;
    private final GetUserLibraryByListUseCase getUserLibraryByListUseCase;
    private final GetLibraryCountsUseCase getLibraryCountsUseCase;
    private final SaveToLibraryUseCase saveToLibraryUseCase;
    private final ChangeReadingListUseCase changeReadingListUseCase;
    private final RemoveFromLibraryUseCase removeFromLibraryUseCase;
    private final LibraryMapper libraryMapper;

    @GetMapping
    @Operation(summary = "Minha biblioteca", description = "Retorna mangás salvos do usuário com paginação. Filtrável por lista.")
    public ResponseEntity<ApiResponse<PageResponse<SavedMangaResponse>>> getLibrary(
            @CurrentUserId UUID userId,
            @PageParams(defaultSort = "savedAt", defaultDirection = "desc")
            Pageable pageable,
            @RequestParam(required = false) String list
    ) {
        var result = (list != null)
                ? getUserLibraryByListUseCase.execute(userId, ReadingListType.fromValue(list), pageable)
                : getUserLibraryUseCase.execute(userId, pageable);

        var mapped = result.map(libraryMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @GetMapping("/counts")
    @Operation(summary = "Contagens da biblioteca", description = "Retorna a quantidade de mangás por lista de leitura")
    public ResponseEntity<ApiResponse<LibraryCountsResponse>> getCounts(
            @CurrentUserId UUID userId
    ) {
        var counts = getLibraryCountsUseCase.execute(userId);

        return ResponseEntity.ok(ApiResponse.success(
                new LibraryCountsResponse(counts.lendo(), counts.queroLer(), counts.concluido(), counts.total())
        ));
    }

    @PostMapping
    @Operation(summary = "Salvar na biblioteca", description = "Adiciona um título à biblioteca do usuário")
    public ResponseEntity<ApiResponse<SavedMangaResponse>> save(
            @Valid @RequestBody SaveToLibraryRequest request,
            @CurrentUserId UUID userId
    ) {
        var input = new SaveToLibraryUseCase.SaveToLibraryInput(
                userId,
                request.titleId(),
                ReadingListType.fromValue(request.list())
        );

        var saved = saveToLibraryUseCase.execute(input);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(libraryMapper.toResponse(saved)));
    }

    @PatchMapping("/{titleId}")
    @Operation(summary = "Alterar lista", description = "Muda a lista de leitura de um mangá salvo")
    public ResponseEntity<ApiResponse<SavedMangaResponse>> changeList(
            @PathVariable String titleId,
            @Valid @RequestBody ChangeListRequest request,
            @CurrentUserId UUID userId
    ) {
        var input = new ChangeReadingListUseCase.ChangeListInput(
                userId,
                titleId,
                ReadingListType.fromValue(request.list())
        );

        var saved = changeReadingListUseCase.execute(input);

        return ResponseEntity.ok(ApiResponse.success(libraryMapper.toResponse(saved)));
    }

    @DeleteMapping("/{titleId}")
    @Operation(summary = "Remover da biblioteca", description = "Remove um título da biblioteca do usuário")
    public ResponseEntity<Void> remove(
            @PathVariable String titleId,
            @CurrentUserId UUID userId
    ) {
        removeFromLibraryUseCase.execute(userId, titleId);

        return ResponseEntity.noContent().build();
    }
}
