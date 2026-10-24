package com.toonlira.translationgateway.evaluation;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.reset;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.google.cloud.storage.BlobId;
import com.google.cloud.storage.Storage;
import com.google.cloud.vision.v1.AnnotateImageResponse;
import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.Block;
import com.google.cloud.vision.v1.BoundingPoly;
import com.google.cloud.vision.v1.Page;
import com.google.cloud.vision.v1.Paragraph;
import com.google.cloud.vision.v1.Symbol;
import com.google.cloud.vision.v1.TextAnnotation;
import com.google.cloud.vision.v1.Vertex;
import com.google.cloud.vision.v1.Word;
import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.application.OcrManifestService;
import com.toonlira.translationgateway.application.OcrPersistenceUseCase;
import com.toonlira.translationgateway.application.ReserveJobUseCase;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.application.port.OcrJobRepository;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.domain.GatewayException;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.infrastructure.ocr.FakeVisionServer;
import com.toonlira.translationgateway.infrastructure.ocr.EvaluationVisionCapture;
import com.toonlira.translationgateway.infrastructure.ocr.VisionClientFactory;
import com.toonlira.translationgateway.infrastructure.ocr.VisionOcrAdapter;
import com.toonlira.translationgateway.infrastructure.storage.EvaluationStorageFactory;
import com.toonlira.translationgateway.infrastructure.storage.LocalObjectStorageAdapter;
import io.grpc.Status;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** Test classpath only. Never accepts a datasource URL or exposes an HTTP listener. */
@Tag("testcontainers")
@Testcontainers
// The class-scoped container stops after each subclass; never reuse its datasource in the next class.
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
@ActiveProfiles("worker")
@SpringBootTest(properties = {"gateway.enabled=false", "gateway.ocr.mode=disabled", "gateway.storage.mode=local",
    "gateway.dispatch.mode=disabled", "spring.main.banner-mode=off", "logging.level.root=OFF",
    "spring.jpa.show-sql=false", "spring.flyway.enabled=true"})
@AutoConfigureMockMvc(print = org.springframework.boot.webmvc.test.autoconfigure.MockMvcPrint.NONE)
@Import(EvaluationHarness.Configuration.class)
abstract class EvaluationHarness {
    @Container static final PostgreSQLContainer<?> DATABASE = new PostgreSQLContainer<>("postgres:17-alpine");
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", DATABASE::getJdbcUrl);
        registry.add("spring.datasource.username", DATABASE::getUsername);
        registry.add("spring.datasource.password", DATABASE::getPassword);
    }
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired ReserveJobUseCase reserve;
    @Autowired GatewayRepository jobs;
    @Autowired OcrJobRepository stages;
    @Autowired JdbcClient jdbc;
    @Autowired TransactionTemplate transaction;
    @Autowired EvaluationStorage storage;
    @Autowired EvaluationOcr ocr;
    @MockitoSpyBean OcrPersistenceUseCase persistence;

    @TestConfiguration(proxyBeanMethods = false)
    static class Configuration {
        @Bean @Primary EvaluationOcr evaluationOcr() { return new EvaluationOcr(); }
        @Bean @Primary EvaluationStorage evaluationStorage() { return new EvaluationStorage(); }
    }

    static void validateMode(String mode, String project, String bucket, boolean confirmed) {
        if (!List.of("offline", "vision").contains(mode) || (mode.equals("vision") && (!confirmed
            || !project.matches("[a-z][a-z0-9-]{4,28}[a-z0-9]") || !bucket.matches("[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]")))) {
            throw new IllegalArgumentException("evaluation-configuration-invalid");
        }
    }

    Map<String, Object> evaluate(Path input, JsonNode sample, Path output, String mode, String project,
                                 String bucket, boolean confirmed, String scenario) throws Exception {
        return evaluate(input, sample, output, mode, project, bucket, confirmed, scenario, null, null, null);
    }

    Map<String, Object> evaluate(Path input, JsonNode sample, Path output, String mode, String project,
                                 String bucket, boolean confirmed, String scenario, Path credentialsFile,
                                 String serviceAccount, Path repository) throws Exception {
        validateMode(mode, project, bucket, confirmed); // Before ADC, storage or any provider client.
        if (!mode.equals("offline") && !scenario.equals("success")) throw new IllegalArgumentException("evaluation-configuration-invalid");
        reset(persistence);
        var result = new LinkedHashMap<String, Object>();
        result.put("status", "failed"); result.put("errorCode", "evaluation-unavailable");
        result.put("javaVersion", System.getProperty("java.version"));
        result.put("visionVersion", com.google.cloud.vision.v1.ImageAnnotatorClient.class.getPackage().getImplementationVersion());
        result.put("endpoint", VisionClientFactory.ENDPOINT);
        result.put("deadlineSeconds", 60);
        result.put("flywayChain", "V1-V3");
        result.put("quotaProject", mode.equals("vision") ? project : "not-applicable");
        result.put("credentialMode", mode.equals("vision") ? "explicit-impersonated-service-account" : "none");
        var capture = new EvaluationVisionCapture(output, mode.equals("offline"));
        FakeVisionServer server = null;
        VisionOcrAdapter adapter = null;
        Path local = null;
        var inspector = new MediaInspectionService();
        storage.reset(output, mapper);
        String phase = "media-validation";
        try {
            if (Files.isSymbolicLink(input) || Files.size(input) != sample.path("bytes").asLong()) throw new IllegalArgumentException();
            try (var original = Files.newInputStream(input)) {
                var media = inspector.inspect(original, 12_582_912);
                try {
                    if (!media.sha256().equals(sample.path("sha256").asText()) || !media.mimeType().equals(sample.path("mime").asText("image/jpeg"))
                        || media.widthPx() != sample.path("width").asInt() || media.heightPx() != sample.path("height").asInt()) {
                        result.put("errorCode", "ocr-invalid-media"); return result;
                    }
                    var properties = new GatewayProperties();
                    phase = "adapter-initialization";
                    if (mode.equals("offline")) {
                        local = Files.createTempDirectory("toonlira-ocr-evaluation-");
                        properties.getStorage().setLocalDirectory(local);
                        storage.delegate = new LocalObjectStorageAdapter(properties);
                        storage.local = local;
                        server = new FakeVisionServer();
                        var response = syntheticResponse(media.widthPx(), media.heightPx());
                        server.handler = (request, observer) -> {
                            if (scenario.equals("timeout")) return;
                            if (scenario.equals("unavailable")) { observer.onError(Status.UNAVAILABLE.asRuntimeException()); return; }
                            if (scenario.equals("concurrent") || scenario.equals("cancel")) {
                                try {
                                    if (scenario.equals("cancel")) transaction.executeWithoutResult(ignored -> jobs.cancel(storage.installation, storage.jobRef, Instant.now()));
                                    deliver(storage.jobRef);
                                } catch (Exception ignored) { observer.onError(Status.INTERNAL.asRuntimeException()); return; }
                            }
                            observer.onNext(scenario.equals("invalid-response") ? BatchAnnotateImagesResponse.getDefaultInstance() : response);
                            observer.onCompleted();
                        };
                        adapter = new VisionOcrAdapter(server.client(scenario.equals("timeout") ? Duration.ofMillis(200) : VisionClientFactory.DEADLINE, capture), "test-project", "private-fixtures");
                    } else {
                        var credentials = EvaluationCredentials.load(credentialsFile, repository, project, serviceAccount);
                        result.put("serviceAccount", credentials.getAccount());
                        // Read-only preflight: require a pre-existing US bucket with enforced public access prevention.
                        storage.cloud = EvaluationStorageFactory.options(credentials, project).getService();
                        storage.bucket = bucket;
                        var info = storage.cloud.get(bucket);
                        if (info == null || !info.getLocation().toUpperCase(java.util.Locale.ROOT).startsWith("US")
                            || info.getIamConfiguration() == null
                            || !Boolean.TRUE.equals(info.getIamConfiguration().isUniformBucketLevelAccessEnabled())
                            || !"enforced".equalsIgnoreCase(String.valueOf(info.getIamConfiguration().getPublicAccessPrevention()))) {
                            throw new IllegalArgumentException("evaluation-configuration-invalid");
                        }
                        properties.getStorage().setBucket(bucket);
                        storage.delegate = EvaluationStorageFactory.adapter(storage.cloud, bucket);
                        adapter = new VisionOcrAdapter(EvaluationVisionCapture.client(credentials, capture), project, bucket);
                    }
                    ocr.delegate = adapter;
                    phase = "job-preparation";
                    var installation = UUID.randomUUID();
                    var now = Instant.now();
                    transaction.executeWithoutResult(ignored -> jobs.createInstallation(installation, "evaluation-only-no-session:" + installation, now));
                    var id = UUID.randomUUID();
                    var key = "private/originals/" + UUID.randomUUID();
                    storage.jobId = id;
                    storage.originalKey = key;
                    storage.store(key, media.path(), media.mimeType(), media.sha256(), now);
                    var source = sample.path("language").asText();
                    var job = reserve.execute(new GatewayRepository.NewJob(id, UUID.randomUUID(), installation, UUID.randomUUID(),
                        UUID.randomUUID(), "evaluation-not-approved-disclosure", source, source.equals("pt-BR") ? "en" : "pt-BR",
                        media.mimeType(), media.byteSize(), media.widthPx(), media.heightPx(), key, media.sha256(), media.sha256(),
                        now, now.plus(7, ChronoUnit.DAYS))).job();
                    storage.jobRef = job.jobRef();
                    storage.installation = installation;
                    transaction.executeWithoutResult(ignored -> {
                        var claim = jobs.claimDispatches(1, now, now.plusSeconds(60)).getFirst();
                        if (!job.id().equals(claim.jobId()) || !jobs.markDispatched(job.id(), claim.attemptCount(), now))
                            throw new IllegalStateException("Invalid evaluation dispatch fixture");
                    });
                    storage.failManifest = scenario.equals("upload-failure");
                    if (scenario.equals("rollback") || scenario.equals("lost-ack")) {
                        doAnswer(call -> {
                            if (scenario.equals("lost-ack")) {
                                var committed = new TransactionTemplate(transaction.getTransactionManager());
                                committed.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
                                committed.executeWithoutResult(ignored -> stages.complete(call.getArgument(0), call.getArgument(1), call.getArgument(2), call.getArgument(3)));
                            }
                            else transaction.executeWithoutResult(ignored -> {
                                stages.complete(call.getArgument(0), call.getArgument(1), call.getArgument(2), call.getArgument(3));
                                throw new IllegalStateException("injected-rollback");
                            });
                            throw new IllegalStateException("injected-ack-loss");
                        }).when(persistence).complete(any(), any(), any(), any());
                    }
                    if (mvc.perform(get("/v1/capabilities")).andReturn().getResponse().getStatus() != 403) throw new IllegalStateException();
                    phase = "worker-request";
                    int http = deliver(job.jobRef());
                    result.put("httpStatus", http);
                    if (mode.equals("offline")) deliver(job.jobRef()); // Same task, never a new job/provider attempt.
                    result.put("jobRef", job.jobRef().toString());
                    result.put("jobStatus", persistence.find(job.jobRef()).status().name());
                    phase = "result-export";
                    var row = transaction.execute(ignored -> jdbc.sql("SELECT status, error_code, output_object_key, output_sha256 FROM processing_job_stages WHERE job_id = :id AND stage = 'OCR'")
                        .param("id", job.id()).query().singleRow());
                    result.put("stageStatus", row.get("status"));
                    if ("SUCCEEDED".equals(row.get("status")) && "TRANSLATING".equals(result.get("jobStatus"))) {
                        byte[] bytes;
                        try (var stream = storage.open((String) row.get("output_object_key"))) { bytes = stream.readNBytes(1_048_577); }
                        if (bytes.length > 1_048_576 || !hash(bytes).equals(row.get("output_sha256"))) throw new IllegalStateException();
                        var manifest = mapper.readValue(bytes, OcrManifest.class);
                        new OcrManifestService(mapper).encode(manifest);
                        if (!manifest.jobRef().equals(job.jobRef()) || !manifest.sourceLanguage().equals(source)
                            || manifest.widthPx() != media.widthPx() || manifest.heightPx() != media.heightPx()) throw new IllegalStateException();
                        writePrivate(output.resolve("manifest.json"), bytes);
                        result.put("manifestSha256", hash(bytes)); result.put("status", "succeeded"); result.remove("errorCode");
                    } else result.put("errorCode", row.get("error_code") == null ? "evaluation-incomplete" : row.get("error_code"));
                } finally { inspector.deleteQuietly(media.path()); }
            }
        } catch (GatewayException error) { result.put("errorCode", error.code().value()); }
        catch (Exception ignored) { result.put("failurePhase", phase); /* No raw exception leaves this boundary. */ }
        finally {
            result.put("rawResponse", capture.metadata());
            if ("succeeded".equals(result.get("status")) && !"captured".equals(capture.metadata().get("status"))) {
                result.put("status", "failed"); result.put("errorCode", "evaluation-raw-capture-unavailable");
            }
            if (mode.equals("offline")) result.put("rpcCalls", server == null ? 0 : server.calls.get());
            else result.put("rpcCalls", null); // Real provider call count is not remotely observable after an ambiguous failure.
            try { if (adapter != null) adapter.close(); } catch (Exception ignored) { }
            try { if (server != null) server.close(); } catch (Exception ignored) { Thread.currentThread().interrupt(); }
            result.put("cleanupPending", storage.cleanup());
            result.put("finishedAt", Instant.now().toString());
            if (local != null) {
                // Only empty directories below our newly allocated temporary directory are removed.
                try (var paths = Files.walk(local)) {
                    for (var path : paths.sorted(java.util.Comparator.reverseOrder()).toList()) {
                        if (Files.isDirectory(path)) try { Files.delete(path); } catch (java.io.IOException ignored) { }
                    }
                }
            }
            ocr.delegate = null;
        }
        return result;
    }

    int deliver(UUID jobRef) throws Exception {
        return mvc.perform(post("/internal/tasks/ocr").contentType("application/json")
            .content(mapper.writeValueAsBytes(Map.of("jobRef", jobRef)))).andReturn().getResponse().getStatus();
    }

    JsonNode sample(Path image) throws Exception {
        var inspected = javax.imageio.ImageIO.read(image.toFile());
        return mapper.valueToTree(Map.of("language", "pt-BR", "sha256", hash(Files.readAllBytes(image)),
            "bytes", Files.size(image), "width", inspected.getWidth(), "height", inspected.getHeight()));
    }

    static String hash(byte[] bytes) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }

    static void writePrivate(Path path, byte[] bytes) throws Exception {
        try (var out = Files.newByteChannel(path, java.util.Set.of(StandardOpenOption.CREATE_NEW, StandardOpenOption.WRITE),
            PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rw-------")))) {
            var buffer = java.nio.ByteBuffer.wrap(bytes);
            while (buffer.hasRemaining()) out.write(buffer);
        }
    }

    static BatchAnnotateImagesResponse syntheticResponse(int width, int height) {
        var box = BoundingPoly.newBuilder();
        for (int[] point : new int[][]{{10, 10}, {width - 10, 10}, {width - 10, height / 4}, {10, height / 4}}) {
            box.addVertices(Vertex.newBuilder().setX(point[0]).setY(point[1]));
        }
        var paragraph = Paragraph.newBuilder().setBoundingBox(box)
            .addWords(Word.newBuilder().addSymbols(Symbol.newBuilder().setText("SIMULAÇÃO: texto sintético, não extraído da imagem.")));
        return BatchAnnotateImagesResponse.newBuilder().addResponses(AnnotateImageResponse.newBuilder()
            .setFullTextAnnotation(TextAnnotation.newBuilder().setText("SIMULAÇÃO")
                .addPages(Page.newBuilder().setWidth(width).setHeight(height).addBlocks(Block.newBuilder().addParagraphs(paragraph))))).build();
    }

    static final class EvaluationOcr implements OcrPort {
        OcrPort delegate;
        public boolean available() { return delegate != null && delegate.available(); }
        public List<OcrManifest.Region> recognize(Command command) { return delegate.recognize(command); }
    }

    static final class EvaluationStorage implements ObjectStoragePort {
        ObjectStoragePort delegate;
        Storage cloud;
        String bucket;
        Path local;
        UUID jobId;
        UUID jobRef;
        UUID installation;
        String originalKey;
        boolean failManifest;
        Path output;
        ObjectMapper mapper;
        final List<String> keys = new ArrayList<>();
        void reset(Path output, ObjectMapper mapper) {
            this.output = output; this.mapper = mapper;
            keys.clear(); delegate = null; cloud = null; bucket = null; local = null; failManifest = false;
        }
        private void allowed(String key) {
            if (!key.equals(originalKey) && (jobId == null || key.contains("..")
                || (!key.startsWith("private/ocr/" + jobId + "/") && !key.startsWith("private/layout/" + jobId + "/")))) {
                throw new IllegalArgumentException("evaluation-storage-scope-invalid");
            }
        }
        public void store(String key, Path source, String mime, String sha, Instant now) {
            allowed(key);
            keys.add(key);
            // Create-only journal BEFORE the upload; a crash may otherwise hide an orphan.
            try { writePrivate(output.resolve("object-" + keys.size() + ".json"), mapper.writeValueAsBytes(Map.of("key", key, "bucket", bucket == null ? "local" : bucket))); }
            catch (Exception ignored) { throw new IllegalStateException("evaluation-journal-unavailable"); }
            if (failManifest && key.startsWith("private/ocr/")) throw new IllegalStateException("injected-storage-failure");
            delegate.store(key, source, mime, sha, now);
        }
        public InputStream open(String key) { allowed(key); return delegate.open(key); }
        public void delete(String key) { allowed(key); delegate.delete(key); }
        public int deleteOlderThan(Instant cutoff) { throw new UnsupportedOperationException("evaluation-broad-cleanup-forbidden"); }
        boolean cleanup() {
            boolean pending = false;
            for (var key : keys) {
                try {
                    if (delegate == null) { pending = true; continue; }
                    delegate.delete(key);
                    if (cloud != null ? cloud.get(BlobId.of(bucket, key)) != null : Files.exists(local.resolve(key))) pending = true;
                } catch (Exception ignored) { pending = true; }
            }
            return pending;
        }
    }
}
