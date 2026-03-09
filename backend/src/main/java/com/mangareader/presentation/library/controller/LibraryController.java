package com.mangareader.presentation.library.controller;

import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
import com.mangareader.application.library.usecase.GetUserLibraryUseCase;
import com.mangareader.application.library.usecase.RemoveFromLibraryUseCase;
import com.mangareader.application.library.usecase.SaveToLibraryUseCase;
import com.mangareader.domain.library.valueobject.ReadingListType;
import com.mangareader.presentation.library.dto.ChangeListRequest;
import com.mangareader.presentation.library.dto.SaveToLibraryRequest;
import com.mangareader.presentation.library.dto.SavedMangaResponse;
import com.mangareader.presentation.library.mapper.LibraryMapper;
import com.mangareader.shared.dto.ApiResponse;
import com.mangareader.shared.dto.PageResponse;

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
    private final SaveToLibraryUseCase saveToLibraryUseCase;
    private final ChangeReadingListUseCase changeReadingListUseCase;
    private final RemoveFromLibraryUseCase removeFromLibraryUseCase;

    @GetMapping
    @Operation(summary = "Minha biblioteca", description = "Retorna mangás salvos do usuário com paginação")
    public ResponseEntity<ApiResponse<PageResponse<SavedMangaResponse>>> getLibrary(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "savedAt") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        var pageable = buildPageable(page, size, sort, direction);

        var result = getUserLibraryUseCase.execute(extractUserId(auth), pageable);

        var mapped = result.map(LibraryMapper::toResponse);

        return ResponseEntity.ok(ApiResponse.success(PageResponse.from(mapped)));
    }

    @PostMapping
    @Operation(summary = "Salvar na biblioteca", description = "Adiciona um título à biblioteca do usuário")
    public ResponseEntity<ApiResponse<SavedMangaResponse>> save(
            @Valid @RequestBody SaveToLibraryRequest request,
            Authentication auth
    ) {
        var input = new SaveToLibraryUseCase.SaveToLibraryInput(
                extractUserId(auth),
                request.titleId(),
                parseReadingList(request.list())
        );

        var saved = saveToLibraryUseCase.execute(input);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(LibraryMapper.toResponse(saved)));
    }

    @PatchMapping("/{titleId}")
    @Operation(summary = "Alterar lista", description = "Muda a lista de leitura de um mangá salvo")
    public ResponseEntity<ApiResponse<SavedMangaResponse>> changeList(
            @PathVariable String titleId,
            @Valid @RequestBody ChangeListRequest request,
            Authentication auth
    ) {
        var input = new ChangeReadingListUseCase.ChangeListInput(
                extractUserId(auth),
                titleId,
                parseReadingList(request.list())
        );

        var saved = changeReadingListUseCase.execute(input);

        return ResponseEntity.ok(ApiResponse.success(LibraryMapper.toResponse(saved)));
    }

    @DeleteMapping("/{titleId}")
    @Operation(summary = "Remover da biblioteca", description = "Remove um título da biblioteca do usuário")
    public ResponseEntity<Void> remove(@PathVariable String titleId, Authentication auth) {
        removeFromLibraryUseCase.execute(extractUserId(auth), titleId);

        return ResponseEntity.noContent().build();
    }

    // TODO: Retirar essa lógica do controller
    private UUID extractUserId(Authentication auth) {
        return (UUID) auth.getPrincipal();
    }

    private ReadingListType parseReadingList(String list) {
        return switch (list) {
            case "Lendo" -> ReadingListType.LENDO;
            case "Quero Ler" -> ReadingListType.QUERO_LER;
            case "Concluído" -> ReadingListType.CONCLUIDO;
            default -> ReadingListType.valueOf(list);
        };
    }

    private Pageable buildPageable(int page, int size, String sort, String direction) {
        var dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;

        return PageRequest.of(page, size, Sort.by(dir, sort));
    }
}
