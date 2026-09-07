package com.toonlira.presentation.admin.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.toonlira.application.publisher.usecase.CreatePublisherUseCase;
import com.toonlira.application.publisher.usecase.CreatePublisherUseCase.CreatePublisherInput;
import com.toonlira.application.publisher.usecase.DeletePublisherUseCase;
import com.toonlira.application.publisher.usecase.UpdatePublisherUseCase;
import com.toonlira.application.publisher.usecase.UpdatePublisherUseCase.UpdatePublisherInput;
import com.toonlira.presentation.publisher.dto.CreatePublisherRequest;
import com.toonlira.presentation.publisher.dto.PublisherResponse;
import com.toonlira.presentation.publisher.dto.UpdatePublisherRequest;
import com.toonlira.presentation.publisher.mapper.PublisherMapper;
import com.toonlira.shared.dto.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Endpoints admin para gestão de editoras.
 */
@RestController
@RequestMapping("/api/admin/publishers")
@RequiredArgsConstructor
public class AdminPublisherController {
    private final CreatePublisherUseCase createPublisherUseCase;
    private final UpdatePublisherUseCase updatePublisherUseCase;
    private final DeletePublisherUseCase deletePublisherUseCase;

    @PostMapping
    public ResponseEntity<ApiResponse<PublisherResponse>> create(
            @Valid @RequestBody CreatePublisherRequest request
    ) {
        var publisher = createPublisherUseCase.execute(
                new CreatePublisherInput(
                        request.name(), request.country(), request.website(),
                        request.logoUrl(), request.description(),
                        request.aliases() == null ? null : request.aliases().stream()
                                .map(alias -> new CreatePublisherUseCase.AliasInput(
                                        alias.name(), alias.type()))
                                .toList()));

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(PublisherMapper.toResponse(publisher)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PublisherResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePublisherRequest request
    ) {
        var publisher = updatePublisherUseCase.execute(
                new UpdatePublisherInput(
                        id, request.name(), request.country(), request.website(),
                        request.logoUrl(), request.description(),
                        request.aliases() == null ? null : request.aliases().stream()
                                .map(alias -> new CreatePublisherUseCase.AliasInput(
                                        alias.name(), alias.type()))
                                .toList()));

        return ResponseEntity.ok(ApiResponse.success(PublisherMapper.toResponse(publisher)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        deletePublisherUseCase.execute(id);

        return ResponseEntity.noContent().build();
    }
}
