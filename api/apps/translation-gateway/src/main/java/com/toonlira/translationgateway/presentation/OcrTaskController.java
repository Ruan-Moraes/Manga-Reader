package com.toonlira.translationgateway.presentation;

import com.toonlira.translationgateway.application.ProcessOcrTaskUseCase;
import com.toonlira.translationgateway.application.ProcessTranslationTaskUseCase;
import com.toonlira.translationgateway.application.ProcessRenderingTaskUseCase;
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
    ResponseEntity<Void> process(@Valid @RequestBody TaskRequest request) {
        process.execute(request.jobRef());
        translation.ifAvailable(useCase -> useCase.execute(request.jobRef()));
        rendering.ifAvailable(useCase -> useCase.execute(request.jobRef()));
        return ResponseEntity.noContent().build();
    }

    public record TaskRequest(@NotNull UUID jobRef) { }
}
