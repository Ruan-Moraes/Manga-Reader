package com.toonlira.translationgateway.evaluation;

import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.application.port.LayoutPort;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.layout.LayoutManifest;
import com.toonlira.translationgateway.domain.layout.ReadingDirection;
import com.toonlira.translationgateway.infrastructure.layout.ComicDetectorModel;
import com.toonlira.translationgateway.infrastructure.layout.LocalLayoutAdapter;
import com.toonlira.translationgateway.infrastructure.layout.OnnxBubbleDetector;
import com.toonlira.translationgateway.infrastructure.ocr.VisionResponseMapper;
import com.toonlira.translationgateway.infrastructure.storage.LocalObjectStorageAdapter;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryType;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/** Explicit local replay only. No provider/client factory/credentials are initialized. */
@EnabledIfEnvironmentVariable(named = "OCR_LAYOUT_ANALYSIS_ID", matches = "[a-z0-9][a-z0-9-]{0,63}")
@Import(ManualLayoutEvaluationIT.Configuration.class)
class ManualLayoutEvaluationIT extends EvaluationHarness {
    @TestConfiguration(proxyBeanMethods = false)
    static class Configuration {
        @Bean @Primary LayoutPort realLocalLayout() {
            return new LocalLayoutAdapter(new OnnxBubbleDetector(Path.of(System.getenv("OCR_LAYOUT_MODEL"))),
                ReadingDirection.valueOf(System.getenv("OCR_LAYOUT_DIRECTION")), Duration.ofSeconds(30));
        }
    }

    @Test void replayCapturedOcrThroughWorkerAndExportSeparateLayout() throws Exception {
        var root = Path.of(System.getProperty("basedir")).resolve("../../..").normalize().toAbsolutePath();
        String runId = System.getenv("OCR_LAYOUT_RUN_ID");
        String analysisId = System.getenv("OCR_LAYOUT_ANALYSIS_ID");
        if (!runId.matches("[a-z0-9][a-z0-9-]{0,63}")) throw new IllegalArgumentException("layout-run-invalid");
        var samples = root.resolve(".local/ocr-samples");
        var run = samples.resolve("runs").resolve(runId);
        var output = run.resolve("layouts").resolve(analysisId);
        for (Path directory : List.of(root.resolve(".local"), samples, samples.resolve("images"), samples.resolve("runs"), run,
            run.resolve("layouts"), output)) {
            if (Files.isSymbolicLink(directory) || !Files.isDirectory(directory)) throw new IllegalArgumentException("layout-path-invalid");
        }
        var request = mapper.readTree(readBounded(run.resolve("request.json"), 65536));
        var sourceResult = mapper.readTree(readBounded(run.resolve("result.json"), 65536));
        var sample = request.path("sample");
        var catalog = mapper.readTree(readBounded(root.resolve("api/apps/translation-gateway/docs/ocr-evaluation/samples.json"), 262144));
        boolean admitted = false;
        for (var candidate : catalog.path("samples")) if (candidate.equals(sample)) admitted = true;
        if (!admitted || !sample.path("file").asText().matches("[a-z0-9-]+\\.(jpg|png)")) throw new IllegalArgumentException("layout-sample-invalid");
        var sourceBytes = readBounded(run.resolve("manifest.json"), 1048576);
        var original = mapper.readValue(sourceBytes, OcrManifest.class);
        var raw = readBounded(run.resolve("vision-response.pb"), 4194304);
        if (!hash(sourceBytes).equals(sourceResult.path("manifestSha256").asText())
            || !hash(raw).equals(sourceResult.path("rawResponse").path("sha256").asText())) throw new IllegalArgumentException("layout-source-hash-invalid");
        var response = BatchAnnotateImagesResponse.parseFrom(raw);
        var input = samples.resolve("images").resolve(sample.path("file").asText());
        writePrivate(output.resolve("invocation.lock"), new byte[0]);
        var result = new LinkedHashMap<String, Object>();
        result.put("status", "failed");
        result.put("ocrSource", "replay-of-existing-capture");
        result.put("layoutSource", "new-local-cpu-inference");
        result.put("newVisionCalls", 0);
        result.put("startedAt", Instant.now().toString());
        result.put("flywayChain", "V1-V3");
        result.put("javaVersion", System.getProperty("java.version"));
        result.put("runtime", ComicDetectorModel.RUNTIME);
        var calls = new AtomicInteger();
        long started = System.nanoTime();
        Path local = Files.createTempDirectory("toonlira-layout-eval-");
        storage.reset(output, mapper);
        var properties = new GatewayProperties();
        properties.getStorage().setLocalDirectory(local);
        storage.delegate = new LocalObjectStorageAdapter(properties);
        storage.local = local;
        try (var stream = Files.newInputStream(input)) {
            var inspector = new MediaInspectionService();
            var media = inspector.inspect(stream, 12582912);
            try {
                assertThat(media.sha256()).isEqualTo(sample.path("sha256").asText());
                assertThat(media.byteSize()).isEqualTo(sample.path("bytes").asLong());
                assertThat(media.mimeType()).isEqualTo(sample.path("mime").asText("image/jpeg"));
                assertThat(media.widthPx()).isEqualTo(original.widthPx()).isEqualTo(sample.path("width").asInt());
                assertThat(media.heightPx()).isEqualTo(original.heightPx()).isEqualTo(sample.path("height").asInt());
                ocr.delegate = new OcrPort() {
                    public boolean available() { return true; }
                    public List<OcrManifest.Region> recognize(Command command) {
                        calls.incrementAndGet();
                        return new VisionResponseMapper().map(response, command);
                    }
                };
                var installation = UUID.randomUUID();
                var now = Instant.now();
                transaction.executeWithoutResult(ignored -> jobs.createInstallation(installation, "layout-eval-only", now));
                storage.jobId = UUID.randomUUID();
                storage.originalKey = "private/originals/" + UUID.randomUUID();
                storage.store(storage.originalKey, media.path(), media.mimeType(), media.sha256(), now);
                var language = sample.path("language").asText();
                var job = reserve.execute(new GatewayRepository.NewJob(storage.jobId, original.jobRef(), installation,
                    UUID.randomUUID(), UUID.randomUUID(), "layout-evaluation-not-approved", language,
                    language.equals("pt-BR") ? "en" : "pt-BR", media.mimeType(), media.byteSize(), media.widthPx(), media.heightPx(),
                    storage.originalKey, media.sha256(), media.sha256(), now, now.plus(7, ChronoUnit.DAYS))).job();
                storage.jobRef = job.jobRef();
                transaction.executeWithoutResult(ignored -> {
                    var claim = jobs.claimDispatches(1, now, now.plusSeconds(60)).getFirst();
                    assertThat(claim.jobId()).isEqualTo(job.id());
                    assertThat(jobs.markDispatched(job.id(), claim.attemptCount(), now)).isTrue();
                });
                assertThat(deliver(job.jobRef())).isEqualTo(204);
                assertThat(deliver(job.jobRef())).isEqualTo(204);
                assertThat(calls).hasValue(1);
                var stage = jdbc.sql("SELECT status, output_sha256 FROM processing_job_stages WHERE job_id = :id AND stage = 'OCR'")
                    .param("id", job.id()).query().singleRow();
                result.put("stageStatus", stage.get("status"));
                result.put("jobStatus", persistence.find(job.jobRef()).status().name());
                assertThat(stage.get("status")).isEqualTo("SUCCEEDED");
                assertThat(stage.get("output_sha256")).isEqualTo(hash(sourceBytes));
                var layoutRow = jdbc.sql("SELECT status, output_object_key, output_sha256, error_code FROM processing_job_layouts WHERE job_id = :id")
                    .param("id", job.id()).query().singleRow();
                result.put("layoutStatus", layoutRow.get("status"));
                result.put("errorCode", layoutRow.get("error_code"));
                if ("SUCCEEDED".equals(layoutRow.get("status"))) {
                    byte[] bytes;
                    try (var layoutStream = storage.open((String) layoutRow.get("output_object_key"))) { bytes = layoutStream.readNBytes(1048577); }
                    assertThat(bytes.length).isLessThanOrEqualTo(1048576);
                    assertThat(hash(bytes)).isEqualTo(layoutRow.get("output_sha256"));
                    var layout = mapper.readValue(bytes, LayoutManifest.class);
                    writePrivate(output.resolve("layout.json"), bytes);
                    result.put("layoutSha256", hash(bytes));
                    result.put("panelCount", layout.panels().size());
                    result.put("bubbleCount", layout.bubbles().size());
                    result.put("suppressedBubbleCount", layout.suppressedBubbles().size());
                    result.put("rawBubbleCount", layout.bubbles().size() + layout.suppressedBubbles().size());
                    result.put("layoutVersion", layout.layoutVersion());
                    result.put("groupSizes", layout.groups().stream().map(group -> group.regionIds().size()).toList());
                    result.put("experimentalState", layout.state().name());
                    result.put("status", "succeeded");
                    if ("pt-ep01-p01".equals(sample.path("id").asText())) {
                        result.put("threePanelsObserved", layout.panels().size() == 3);
                        result.put("twoBubblesObserved", layout.bubbles().size() == 2);
                    }
                }
                assertThat(hash(Files.readAllBytes(input))).isEqualTo(media.sha256());
                assertThat(Files.readAllBytes(run.resolve("manifest.json"))).isEqualTo(sourceBytes);
            } finally { inspector.deleteQuietly(media.path()); }
        } finally {
            result.put("durationMs", (System.nanoTime() - started) / 1000000);
            result.put("peakHeapPoolBytes", ManagementFactory.getMemoryPoolMXBeans().stream()
                .filter(pool -> pool.getType() == MemoryType.HEAP).mapToLong(pool -> pool.getPeakUsage().getUsed()).sum());
            result.put("memoryNote", "Sum of heap pool peaks; excludes native model allocations and is not process RSS");
            result.put("replayCalls", calls.get());
            result.put("cleanupPending", storage.cleanup());
            result.put("finishedAt", Instant.now().toString());
            writePrivate(output.resolve("result.json"), mapper.writeValueAsBytes(result));
            ocr.delegate = null;
        }
    }

    private byte[] readBounded(Path path, long max) throws Exception {
        if (Files.isSymbolicLink(path) || !Files.isRegularFile(path) || Files.size(path) > max)
            throw new IllegalArgumentException("layout-artifact-invalid");
        return Files.readAllBytes(path);
    }
}
