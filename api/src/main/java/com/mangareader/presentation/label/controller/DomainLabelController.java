package com.mangareader.presentation.label.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.label.usecase.GetDomainLabelsByTypeUseCase;
import com.mangareader.presentation.label.dto.DomainLabelAdminResponse;
import com.mangareader.presentation.label.dto.DomainLabelResponse;
import com.mangareader.presentation.shared.mapper.LocalizedMappingHelper;
import com.mangareader.shared.dto.ApiResponse;

import lombok.RequiredArgsConstructor;

/**
 * Endpoints para labels de domínio (status, categorias, tipos, moedas…).
 * <p>
 * Endpoint público resolve labels pelo locale do request ({@code Accept-Language}).
 * Endpoint admin expõe todas as traduções para edição multilíngue.
 */
@RestController
@RequestMapping("/api/labels")
@RequiredArgsConstructor
public class DomainLabelController {

    private final GetDomainLabelsByTypeUseCase getLabelsUseCase;
    private final LocalizedMappingHelper i18n;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DomainLabelResponse>>> getByType(
            @RequestParam String type
    ) {
        var labels = getLabelsUseCase.execute(type).stream()
                .map(label -> new DomainLabelResponse(
                        label.getValue(),
                        i18n.resolveOrSlug(label.getLabelI18n(), label.getValue())
                ))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(labels));
    }

    @GetMapping("/admin")
    public ResponseEntity<ApiResponse<List<DomainLabelAdminResponse>>> getByTypeAdmin(
            @RequestParam String type
    ) {
        var labels = getLabelsUseCase.execute(type).stream()
                .map(label -> new DomainLabelAdminResponse(
                        label.getValue(),
                        i18n.toMap(label.getLabelI18n())
                ))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(labels));
    }
}
