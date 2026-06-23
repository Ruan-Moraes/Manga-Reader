package com.mangareader.presentation.admin.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.author.usecase.CreateAuthorUseCase;
import com.mangareader.application.author.usecase.CreateAuthorUseCase.CreateAuthorInput;
import com.mangareader.application.author.usecase.DeleteAuthorUseCase;
import com.mangareader.application.author.usecase.UpdateAuthorUseCase;
import com.mangareader.application.author.usecase.UpdateAuthorUseCase.UpdateAuthorInput;
import com.mangareader.presentation.author.dto.AuthorResponse;
import com.mangareader.presentation.author.dto.CreateAuthorRequest;
import com.mangareader.presentation.author.dto.UpdateAuthorRequest;
import com.mangareader.presentation.author.mapper.AuthorMapper;
import com.mangareader.shared.dto.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints admin para gestão de autores.
 */
@RestController
@RequestMapping("/api/admin/authors")
@RequiredArgsConstructor
public class AdminAuthorController {
    private final CreateAuthorUseCase createAuthorUseCase;
    private final UpdateAuthorUseCase updateAuthorUseCase;
    private final DeleteAuthorUseCase deleteAuthorUseCase;

    @PostMapping
    public ResponseEntity<ApiResponse<AuthorResponse>> create(
            @Valid @RequestBody CreateAuthorRequest request
    ) {
        var author = createAuthorUseCase.execute(
                new CreateAuthorInput(request.name(), request.bio(), request.nationality()));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(AuthorMapper.toResponse(author)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AuthorResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAuthorRequest request
    ) {
        var author = updateAuthorUseCase.execute(
                new UpdateAuthorInput(id, request.name(), request.bio(), request.nationality()));

        return ResponseEntity.ok(ApiResponse.success(AuthorMapper.toResponse(author)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        deleteAuthorUseCase.execute(id);

        return ResponseEntity.noContent().build();
    }
}
