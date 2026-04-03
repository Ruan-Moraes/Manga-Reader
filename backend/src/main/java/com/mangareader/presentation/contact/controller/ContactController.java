package com.mangareader.presentation.contact.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mangareader.application.contact.usecase.PublishWorkContactUseCase;
import com.mangareader.presentation.contact.dto.PublishWorkRequest;
import com.mangareader.shared.dto.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controller para formulários de contato.
 */
@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final PublishWorkContactUseCase publishWorkContactUseCase;

    @PostMapping("/publish-work")
    public ResponseEntity<ApiResponse<String>> publishWork(
            @Valid @RequestBody PublishWorkRequest request
    ) {
        var input = new PublishWorkContactUseCase.PublishWorkInput(
                request.name(),
                request.email(),
                request.workType(),
                request.workTitle(),
                request.synopsis(),
                request.portfolioLink(),
                request.message()
        );

        publishWorkContactUseCase.execute(input);

        return ResponseEntity.ok(ApiResponse.success(
                "Sua solicitação foi enviada com sucesso! Entraremos em contato em breve."
        ));
    }
}
