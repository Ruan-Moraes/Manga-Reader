package com.toonlira.translationgateway.contract;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;
import org.junit.jupiter.api.Test;

/** Packaging regression guard; actual session I/O remains covered by the Linux runtime probes. */
class ProductionContentBoundaryTest {
    private static final Set<String> RETIRED = Set.of("MediaInspectionService", "MediaSnapshotDirectory", "SubmitPageUseCase",
        "ProcessOcrTaskUseCase", "ProcessTranslationTaskUseCase", "ProcessRenderingTaskUseCase", "ShadowLayoutService",
        "LocalFileRenderAdapter", "NativeFileRenderAdapter", "IsolatedRenderAdapter", "RenderSubprocessProtocol",
        "RenderChildMain", "RenderingTaskChildMain", "StorageBackedRenderingTaskProcess", "RenderingSessionStorage",
        "NativeRenderingConfiguration", "RenderingConfiguration", "OcrTaskController", "WebpProcessCodec", "ValidatedRasterDecoder",
        "LegacyGatewayController", "LegacyNativeWebpCodec", "OcrPort", "DisabledOcrAdapter",
        "LegacyVisionOcrAdapter", "LegacyOcrConfiguration", "InlineVisionOcrAdapter",
        "VolatileGatewayIntegrationProbe", "VolatileGatewayIntegrationClient", "VolatileVisualIntegrationClient",
        "VolatileLoopbackVisionFactory", "VolatileLoopbackTranslationFactory");

    @Test void productionClassesContainNoRetiredContentFilePipeline() throws Exception {
        try (var classes = Files.walk(Path.of("target/classes/com/toonlira/translationgateway"))) {
            var names = classes.filter(path -> path.toString().endsWith(".class"))
                .map(path -> path.getFileName().toString().replaceFirst("\\$.*", ".class").replaceFirst("\\.class$", "")).toList();
            assertThat(names).doesNotContainAnyElementsOf(RETIRED);
            assertThat(names).contains("VolatileRenderChildMain", "NativeMemoryRenderAdapter", "ProcessVolatilePageUseCase", "GatewayController");
        }
    }
    @Test void productionHasNoContentFileWritesOrStorageSubmissionCalls() throws Exception {
        var kernelAndAdmission = Set.of("NativeWorkerParentPreparation.java", "NativeWorkerParentLimitMain.java", "LinuxWorkerMemoryAdmission.java");
        try (var sources = Files.walk(Path.of("src/main/java"))) {
            for (var path : sources.filter(file -> file.toString().endsWith(".java")).toList()) {
                if (kernelAndAdmission.contains(path.getFileName().toString())) continue;
                assertThat(Files.readString(path)).as(path.toString()).doesNotContain(
                    "setGcsImageUri(", "Files.write(", "Files.copy(", "Files.newOutputStream(", "Files.createTempFile(", ".store(");
                if (!path.getFileName().toString().equals("OwnedRenderRuntime.java"))
                    assertThat(Files.readString(path)).as(path.toString()).doesNotContain("Files.createTempDirectory(");
            }
        }
    }
}
