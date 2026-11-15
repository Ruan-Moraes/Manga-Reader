package com.toonlira.translationgateway.infrastructure.rendering;

import com.google.cloud.translate.v3.TranslateTextRequest;
import com.google.cloud.translate.v3.TranslateTextResponse;
import com.google.cloud.vision.v1.AnnotateImageResponse;
import com.google.cloud.vision.v1.BatchAnnotateImagesRequest;
import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.Block;
import com.google.cloud.vision.v1.BoundingPoly;
import com.google.cloud.vision.v1.Page;
import com.google.cloud.vision.v1.Paragraph;
import com.google.cloud.vision.v1.Symbol;
import com.google.cloud.vision.v1.TextAnnotation;
import com.google.cloud.vision.v1.Vertex;
import com.google.cloud.vision.v1.Word;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.toonlira.translationgateway.TranslationGatewayApplication;
import com.toonlira.translationgateway.domain.rendering.InMemoryMedia;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.infrastructure.ocr.VolatileLoopbackVisionFactory;
import com.toonlira.translationgateway.infrastructure.translation.VolatileLoopbackTranslationFactory;
import io.grpc.MethodDescriptor;
import io.grpc.Server;
import io.grpc.ServerServiceDefinition;
import io.grpc.netty.shaded.io.grpc.netty.NettyServerBuilder;
import io.grpc.protobuf.ProtoUtils;
import io.grpc.stub.ServerCalls;
import io.grpc.stub.StreamObserver;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.boot.SpringApplication;

/** Mounted test driver only. Real production Spring/SQL/SDK/renderer; no ADC or Google connection. */
public final class VolatileGatewayIntegrationProbe {
    public static final String SOURCE = "VOLATILE_PIPELINE_SOURCE_020";
    private static final String CHILD = "-Dloader.main=" + VolatileRenderChildMain.class.getName();
    private static final AtomicInteger OCR_CALLS = new AtomicInteger(), TRANSLATION_CALLS = new AtomicInteger(), INLINE_VIOLATIONS = new AtomicInteger();
    private static final AtomicLong MAX_ORIGINAL_BYTES = new AtomicLong();
    private static volatile org.springframework.context.ConfigurableApplicationContext context;
    private static final AtomicReference<String> MODE = new AtomicReference<>("ok");
    private static final String RUNTIME_INSTANCE = UUID.randomUUID().toString();
    private VolatileGatewayIntegrationProbe() { }

    public static void main(String[] args) {
        try {
            var rpc = rpc();
            var diagnostics = HttpServer.create(new InetSocketAddress("0.0.0.0", 8085), 4);
            diagnostics.createContext("/", VolatileGatewayIntegrationProbe::diagnostics);
            diagnostics.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
            diagnostics.start();
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                diagnostics.stop(0); rpc.shutdownNow();
            }, "volatile-test-fixture-close"));
            var application = new SpringApplication(TranslationGatewayApplication.class);
            application.addInitializers(context -> {
                context.getBeanFactory().registerSingleton("probeVisionClientFactory", new VolatileLoopbackVisionFactory(rpc.getPort()));
                context.getBeanFactory().registerSingleton("probeTranslationClientFactory", new VolatileLoopbackTranslationFactory(rpc.getPort()));
            });
            context = application.run(args);
            System.out.println("volatile-gateway-probe-ready");
        } catch (Throwable error) {
            System.err.println("volatile-integration-bootstrap-failed:" + error.getClass().getSimpleName());
            System.exit(1);
        }
    }

    private static Server rpc() throws IOException {
        var vision = MethodDescriptor.<BatchAnnotateImagesRequest, BatchAnnotateImagesResponse>newBuilder()
            .setType(MethodDescriptor.MethodType.UNARY).setFullMethodName("google.cloud.vision.v1.ImageAnnotator/BatchAnnotateImages")
            .setRequestMarshaller(ProtoUtils.marshaller(BatchAnnotateImagesRequest.getDefaultInstance()))
            .setResponseMarshaller(ProtoUtils.marshaller(BatchAnnotateImagesResponse.getDefaultInstance())).build();
        var translation = MethodDescriptor.<TranslateTextRequest, TranslateTextResponse>newBuilder()
            .setType(MethodDescriptor.MethodType.UNARY).setFullMethodName("google.cloud.translation.v3.TranslationService/TranslateText")
            .setRequestMarshaller(ProtoUtils.marshaller(TranslateTextRequest.getDefaultInstance()))
            .setResponseMarshaller(ProtoUtils.marshaller(TranslateTextResponse.getDefaultInstance())).build();
        return NettyServerBuilder.forAddress(new InetSocketAddress("127.0.0.1", 0))
            .maxInboundMessageSize((int) RenderPolicy.MAX_ORIGINAL_BYTES + 1024 * 1024)
            .addService(ServerServiceDefinition.builder("google.cloud.vision.v1.ImageAnnotator")
                .addMethod(vision, ServerCalls.asyncUnaryCall(VolatileGatewayIntegrationProbe::vision)).build())
            .addService(ServerServiceDefinition.builder("google.cloud.translation.v3.TranslationService")
                .addMethod(translation, ServerCalls.asyncUnaryCall((request, observer) -> {
                    TRANSLATION_CALLS.incrementAndGet();
                    var result = TranslateTextResponse.newBuilder();
                    result.addTranslationsBuilder().setModel(request.getModel()).setTranslatedText(visualContent(request));
                    observer.onNext(result.build()); observer.onCompleted();
                })).build()).build().start();
    }

    private static String visualContent(TranslateTextRequest request) {
        String mode = MODE.get();
        if (!mode.startsWith("visual")) return request.getContents(0);
        String text = mode.equals("visual-overflow") ? "Long overflow translation. ".repeat(180) : switch (request.getTargetLanguageCode()) {
            case "pt-BR" -> "A tradução visual preserva o original.\nCada página permanece no seu aparelho.";
            case "en" -> "Visual translation preserves the original.\nEach page stays on your device.";
            case "es" -> "La traducción visual conserva el original.\nCada página permanece en tu dispositivo.";
            case "ja" -> "画像の翻訳でも原本を守ります。\n各ページはお使いの端末に保存されます。";
            case "ko" -> "이미지를 번역해도 원본은 보존됩니다.\n각 페이지는 사용자 기기에 보관됩니다.";
            case "zh-Hans" -> "视觉翻译保留原始图像。\n每一页都保存在您的设备上。";
            case "zh-Hant" -> "視覺翻譯保留原始圖像。\n每一頁都儲存在您的裝置上。";
            default -> throw new IllegalArgumentException();
        };
        return request.getContents(0).replace(SOURCE, text);
    }

    private static void vision(BatchAnnotateImagesRequest request, StreamObserver<BatchAnnotateImagesResponse> observer) {
        OCR_CALLS.incrementAndGet();
        byte[] bytes = null;
        try {
            if ("ocr-fail".equals(MODE.get())) {
                observer.onError(io.grpc.Status.UNAVAILABLE.withDescription("synthetic-provider-failure").asRuntimeException()); return;
            }
            if (request.getRequestsCount() != 1 || request.getRequests(0).getImage().hasSource()) {
                INLINE_VIOLATIONS.incrementAndGet(); throw new IllegalArgumentException();
            }
            bytes = request.getRequests(0).getImage().getContent().toByteArray();
            MAX_ORIGINAL_BYTES.accumulateAndGet(bytes.length, Math::max);
            var source = InMemoryMedia.inspect(bytes, RenderPolicy.initial());
            var box = BoundingPoly.newBuilder()
                .addVertices(Vertex.newBuilder().setX(source.widthPx() / 10).setY(source.heightPx() / 10))
                .addVertices(Vertex.newBuilder().setX(source.widthPx() * 9 / 10).setY(source.heightPx() / 10))
                .addVertices(Vertex.newBuilder().setX(source.widthPx() * 9 / 10).setY(source.heightPx() * 4 / 10))
                .addVertices(Vertex.newBuilder().setX(source.widthPx() / 10).setY(source.heightPx() * 4 / 10));
            var page = Page.newBuilder().setWidth(source.widthPx()).setHeight(source.heightPx());
            if (!"empty".equals(MODE.get())) page.addBlocks(Block.newBuilder().addParagraphs(Paragraph.newBuilder().setBoundingBox(box)
                .addWords(Word.newBuilder().addSymbols(Symbol.newBuilder().setText(SOURCE)))));
            observer.onNext(BatchAnnotateImagesResponse.newBuilder().addResponses(AnnotateImageResponse.newBuilder()
                .setFullTextAnnotation(TextAnnotation.newBuilder().addPages(page))).build());
            observer.onCompleted();
        } catch (RuntimeException error) { observer.onError(io.grpc.Status.INVALID_ARGUMENT.asRuntimeException()); }
        finally { if (bytes != null) Arrays.fill(bytes, (byte) 0); }
    }

    private static void diagnostics(HttpExchange exchange) throws IOException {
        try {
            String path = exchange.getRequestURI().getPath();
            if (path.startsWith("/mode/") && exchange.getRequestMethod().equals("POST")) {
                String mode = path.substring("/mode/".length());
                if (!java.util.Set.of("ok", "empty", "ocr-fail", "visual", "visual-overflow").contains(mode)) throw new IllegalArgumentException();
                MODE.set(mode);
            } else if (path.equals("/kill-native") && exchange.getRequestMethod().equals("POST")) {
                var children = nativeChildren();
                if (children.size() != 1 || !children.getFirst().destroyForcibly()) throw new IllegalStateException();
            } else if ((path.equals("/pause-native") || path.equals("/native-address-fault")) && exchange.getRequestMethod().equals("POST")) {
                var children = nativeChildren();
                if (children.size() != 1) throw new IllegalStateException();
                if (path.equals("/pause-native")) VolatileOwnedFaultProbe.pause(children.getFirst());
                else VolatileOwnedFaultProbe.exhaustAddressSpace(children.getFirst());
            } else if (!path.equals("/metrics") || !exchange.getRequestMethod().equals("GET")) throw new IllegalArgumentException();
            var body = GatewayJsonMapper.create().writeValueAsBytes(metrics());
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.getResponseHeaders().set("Cache-Control", "no-store");
            exchange.sendResponseHeaders(200, body.length); exchange.getResponseBody().write(body);
        } catch (RuntimeException error) {
            exchange.sendResponseHeaders(409, -1);
        } finally { exchange.close(); }
    }

    private static java.util.List<ProcessHandle> nativeChildren() {
        return ProcessHandle.current().children().filter(child -> child.info().arguments()
            .map(args -> Arrays.asList(args).contains(CHILD)).orElse(false)).toList();
    }
    private static long addressSpace(ProcessHandle child) {
        try { return LinuxWorkerMemoryAdmission.addressLimit(Files.readString(Path.of("/proc/" + child.pid() + "/limits"))); }
        catch (IOException vanished) { return 0; }
    }
    private static Map<String, Object> metrics() throws IOException {
        var value = new LinkedHashMap<String, Object>();
        value.put("runtimeInstance", RUNTIME_INSTANCE);
        value.put("ocrCalls", OCR_CALLS.get()); value.put("translationCalls", TRANSLATION_CALLS.get());
        value.put("inlineViolations", INLINE_VIOLATIONS.get()); value.put("maxOriginalBytes", MAX_ORIGINAL_BYTES.get());
        var children = nativeChildren();
        value.put("nativeChildren", children.stream().map(ProcessHandle::pid).toList());
        value.put("nativePeakRssKiB", children.stream().mapToLong(VolatileGatewayIntegrationProbe::rss).max().orElse(0));
        value.put("memoryPeakBytes", number("/sys/fs/cgroup/memory.peak"));
        value.put("memoryLimitBytes", number("/sys/fs/cgroup/memory.max"));
        value.put("swapLimitBytes", number("/sys/fs/cgroup/memory.swap.max"));
        value.put("pidsLimit", number("/sys/fs/cgroup/pids.max"));
        value.put("pidsCurrent", number("/sys/fs/cgroup/pids.current"));
        value.put("parentAddressSpaceBytes", LinuxWorkerMemoryAdmission.addressLimit(Files.readString(Path.of("/proc/self/limits"))));
        value.put("parentVirtualBytes", LinuxWorkerMemoryAdmission.virtualBytes(Files.readString(Path.of("/proc/self/status"))));
        value.put("childAddressSpaceBytes", children.stream().mapToLong(VolatileGatewayIntegrationProbe::addressSpace).max().orElse(0));
        value.put("cpuMaximum", Files.readString(Path.of("/sys/fs/cgroup/cpu.max")));
        value.put("architecture", System.getProperty("os.arch"));
        value.put("pidsEvents", Files.readString(Path.of("/sys/fs/cgroup/pids.events")));
        value.put("memoryEvents", Files.readString(Path.of("/sys/fs/cgroup/memory.events")));
        int regularFiles = 0, contentFiles = 0;
        try (var files = Files.walk(Path.of("/work"))) {
            for (var file : files.filter(Files::isRegularFile).toList()) {
                regularFiles++;
                try (var input = Files.newInputStream(file)) {
                    var bytes = input.readNBytes(65536);
                    var ascii = new String(bytes, StandardCharsets.ISO_8859_1);
                    boolean image = bytes.length >= 12 && (ascii.startsWith("\u0089PNG") || ascii.startsWith("\u00ff\u00d8")
                        || ascii.startsWith("RIFF") && ascii.substring(8, 12).equals("WEBP"));
                    if (image || ascii.contains(SOURCE) || Files.size(file) > 32L * 1024 * 1024) contentFiles++;
                }
            }
        }
        value.put("regularFiles", regularFiles); value.put("contentFiles", contentFiles);
        if (context != null) {
            try (var connection = context.getBean(javax.sql.DataSource.class).getConnection(); var statement = connection.createStatement()) {
                try (var rows = statement.executeQuery("SELECT count(*) FROM processing_jobs")) { rows.next(); value.put("legacyJobRows", rows.getLong(1)); }
                try (var rows = statement.executeQuery("SELECT count(*) FROM volatile_processing_attempts")) { rows.next(); value.put("volatileReceiptRows", rows.getLong(1)); }
            } catch (java.sql.SQLException error) { throw new IOException("Synthetic metadata inspection unavailable"); }
        }
        return value;
    }
    private static long rss(ProcessHandle child) {
        try {
            for (var line : Files.readString(Path.of("/proc/" + child.pid() + "/status")).lines().toList())
                if (line.startsWith("VmRSS:")) return Long.parseLong(line.strip().split("\\s+")[1]);
        } catch (IOException | RuntimeException ignored) { }
        return 0;
    }
    private static long number(String path) throws IOException {
        var value = Files.readString(Path.of(path)).strip();
        if (!value.matches("[0-9]{1,19}")) throw new IllegalStateException();
        return Long.parseLong(value);
    }
}
