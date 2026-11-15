package com.toonlira.translationgateway.presentation;

import com.toonlira.translationgateway.application.ProcessOcrTaskUseCase;
import com.toonlira.translationgateway.application.ProcessTranslationTaskUseCase;
import com.toonlira.translationgateway.application.ProcessRenderingTaskUseCase;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile("worker")
@Tag(name = "Worker Tasks", description = "APIs internas para processamento de tasks (OCR, Tradução, Renderização)")
public class OcrTaskController {
    private final ProcessOcrTaskUseCase process;
    private final ObjectProvider<ProcessTranslationTaskUseCase> translation;
    private final ObjectProvider<ProcessRenderingTaskUseCase> rendering;

    public OcrTaskController(ProcessOcrTaskUseCase process,
                             ObjectProvider<ProcessTranslationTaskUseCase> translation,
                             ObjectProvider<ProcessRenderingTaskUseCase> rendering) {
        this.process = process;
        this.translation = translation;
        this.rendering = rendering;
    }

    @PostMapping("/internal/tasks/ocr")
    @Operation(
        summary = "Processar task de OCR e etapas subsequentes",
        description = "Executado internamente pelo worker. Processa OCR da página, seguido por tradução e renderização se disponíveis"
    )
    @ApiResponse(responseCode = "204", description = "Task processada com sucesso")
    ResponseEntity<Void> process(@Valid @RequestBody TaskRequest request) {
        process.execute(request.jobRef());
        translation.ifAvailable(useCase -> useCase.execute(request.jobRef()));
        rendering.ifAvailable(useCase -> useCase.execute(request.jobRef()));
        return ResponseEntity.noContent().build();
    }

    public record TaskRequest(@NotNull UUID jobRef) { }
}
