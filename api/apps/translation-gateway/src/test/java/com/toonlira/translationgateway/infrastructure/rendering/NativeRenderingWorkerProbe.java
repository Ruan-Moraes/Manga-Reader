package com.toonlira.translationgateway.infrastructure.rendering;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.TranslationGatewayApplication;
import com.toonlira.translationgateway.application.MediaInspectionService;
import com.toonlira.translationgateway.application.CancelJobUseCase;
import com.toonlira.translationgateway.application.DispatchPersistenceUseCase;
import com.toonlira.translationgateway.application.RenderingPersistenceUseCase;
import com.toonlira.translationgateway.application.LifecycleCleanupPersistenceUseCase;
import com.toonlira.translationgateway.application.port.RenderingTaskProcessPort;
import java.time.Clock;
import com.toonlira.translationgateway.application.ReserveJobUseCase;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.GatewayRepository;
import com.toonlira.translationgateway.application.port.ObjectStoragePort;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.application.port.RenderPort;
import com.toonlira.translationgateway.application.port.TranslationPort;
import com.toonlira.translationgateway.application.port.LayoutPort;
import com.toonlira.translationgateway.infrastructure.layout.LocalLayoutAdapter;
import com.toonlira.translationgateway.domain.JobStatus;
import com.toonlira.translationgateway.domain.GatewayErrorCode;
import com.toonlira.translationgateway.domain.OcrManifest;
import com.toonlira.translationgateway.domain.rendering.RenderSource;
import com.toonlira.translationgateway.domain.rendering.RenderPolicy;
import com.toonlira.translationgateway.domain.translation.TranslationResponse;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.lang.management.ManagementFactory;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.tomcat.TomcatWebServer;
import org.springframework.boot.web.server.servlet.context.ServletWebServerApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

/** Test-only context: synthetic/replayed providers; real GCS requires the dedicated metadata-credential opt-in. */
public final class NativeRenderingWorkerProbe {
    private static final long PREVENTIVE_ADDRESS_BYTES = 1536L * 1024 * 1024;
    private static final Path WORK = Path.of("/work"), EXPORT = Path.of("/export"), ORIGINAL = Path.of("/original");
    private static final Path RECOVERY_ORIGINAL = Path.of("/recovery-original");
    private NativeRenderingWorkerProbe() { }

    public static void main(String[] arguments) {
        long started = System.nanoTime();
        var details = new LinkedHashMap<String, Object>();
        details.put("providerMode", "synthetic-test-only"); details.put("phase", "bootstrap");
        String outcome = "failed"; RenderSource source = null;
        try {
            if (arguments.length != 2) invalid();
            boolean storageSession = arguments[0].startsWith("session-");
            if (storageSession) arguments[0] = arguments[0].substring("session-".length());
            details.put("storageProcessSession", storageSession);
            boolean gcsDelivery = arguments[0].equals("runtime-gcs-private-delivery");
            var cloudConfiguration = gcsDelivery ? CloudPrivateDeliveryProbe.configuration(System.getenv()) : null;
            if (gcsDelivery) CloudPrivateDeliveryProbe.verifyMetadataCredentials();
            boolean privateDelivery = arguments[0].equals("runtime-private-delivery") || gcsDelivery;
            boolean cloudSmoke = arguments[0].equals("cloud-smoke-pt-BR") || privateDelivery;
            boolean recorded = arguments[0].equals("recorded-real-page");
            if (recorded) details.put("providerMode", "captured-real-provider-replay-no-network");
            boolean painted = arguments[0].startsWith("runtime-painted-")
                && SyntheticWorkerText.languages().contains(arguments[0].substring("runtime-painted-".length()));
            boolean scripts = painted || arguments[0].startsWith("runtime-script-")
                && SyntheticWorkerText.languages().contains(arguments[0].substring("runtime-script-".length()));
            boolean dimensions = List.of("runtime-dimension-wide", "runtime-dimension-tall", "runtime-dimension-row", "runtime-dimension-column").contains(arguments[0]);
            boolean alternateFormat = List.of("runtime-format-jpeg", "runtime-format-webp").contains(arguments[0]);
            boolean layout = arguments[0].equals("runtime-sdk-layout");
            boolean sdk = arguments[0].equals("runtime-sdk") || layout;
            if (!(recorded || cloudSmoke || scripts || dimensions || alternateFormat || sdk || List.of("small", "maximum", "memory-fault", "address-bounded", "parent-bounded", "runtime-parent", "runtime-memory-fault", "runtime-disk-fault", "runtime-timeout", "runtime-cancel").contains(arguments[0]))) invalid();
            if (sdk) details.put("providerMode", "official-sdk-loopback");
            details.put("scenario", arguments[0]);
            details.put("javaVendor", System.getProperty("java.vendor"));
            details.put("javaRuntimeVersion", System.getProperty("java.runtime.version"));
            details.put("nativePlatform", NativeCodecPlatform.runtime().manifestId());
            details.put("imageRenderingDefaultDisabled", "disabled".equals(System.getenv("GATEWAY_RENDERING_MODE")));
            var uidLine = control("/proc/self/status", 16384).lines().filter(line -> line.startsWith("Uid:")).findFirst().orElseThrow();
            details.put("effectiveUid", Integer.parseInt(uidLine.strip().split("\\s+")[2]));
            boolean preventive = arguments[0].equals("address-bounded");
            details.put("childAddressSpaceLimitBytes", preventive ? PREVENTIVE_ADDRESS_BYTES : NativeProcessLimits.initial().addressSpaceBytes());
            int initialOomAdjustment = LinuxOomPolicy.selfAdjustment();
            details.put("initialParentOomAdjustment", initialOomAdjustment);
            boolean diskFault = arguments[0].equals("runtime-disk-fault");
            boolean timeout = arguments[0].equals("runtime-timeout"), cancellation = arguments[0].equals("runtime-cancel");
            boolean timing = timeout || cancellation;
            boolean allocationFault = arguments[0].equals("runtime-memory-fault") || diskFault;
            boolean admittedFault = allocationFault || timing;
            boolean runtimeParent = recorded || cloudSmoke || arguments[0].equals("runtime-parent") || admittedFault || scripts || dimensions || alternateFormat || sdk;
            if (runtimeParent) {
                var limits = control("/proc/self/limits", 4096).lines().map(String::strip)
                    .filter(line -> line.startsWith("Max address space")).toList();
                require(limits.size() == 1 && limits.getFirst().matches("Max address space\\s+unlimited\\s+unlimited\\s+bytes"));
                require(ManagementFactory.getRuntimeMXBean().getInputArguments().stream()
                    .noneMatch(argument -> argument.startsWith("--enable-native-access")));
                details.put("parentInitiallyUnbounded", true); details.put("parentNativeAccessFlag", false);
                details.put("parentPreparation", "production-bootstrap");
            }
            Files.createDirectory(WORK.resolve("tmp"), PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rwx------")));
            Files.createDirectory(WORK.resolve("render"), PosixFilePermissions.asFileAttribute(PosixFilePermissions.fromString("rwx------")));
            details.put("parentVirtualAtContextStartBytes", LinuxWorkerMemoryAdmission.virtualBytes(control("/proc/self/status", 16384)));
            if (arguments[0].equals("parent-bounded")) {
                details.put("phase", "parent-guard");
                details.putAll(boundOwnedParent());
            }
            try (var context = (ServletWebServerApplicationContext) new SpringApplicationBuilder(
                TranslationGatewayApplication.class, Providers.class, PreventiveAddressConfiguration.class, AdmittedFaultConfiguration.class, AdmittedTimingConfiguration.class).profiles("worker", "renderer-resource-probe")
                .run("--server.port=-1", "--spring.main.banner-mode=off",
                    "--renderer.probe.sdk-loopback=" + sdk,
                    "--renderer.probe.storage-session=" + storageSession,
                    "--gateway.layout.mode=" + (layout ? "shadow" : "disabled"),
                    "--gateway.layout.model-path=/model/detector.onnx", "--gateway.layout.direction=ltr",
                    "--renderer.probe.preventive-address=" + preventive,
                    "--renderer.probe.admitted-fault=" + allocationFault,
                    "--renderer.probe.disk-fault=" + diskFault,
                    "--renderer.probe.timing-fault=" + timing,
                    "--renderer.probe.timeout=" + timeout,
                    "--renderer.probe.cancellation=" + cancellation,
                    "--spring.datasource.url=jdbc:postgresql://postgres:5432/renderer_probe",
                    "--spring.datasource.username=test", "--spring.datasource.password=test",
                    "--gateway.storage.mode=" + (gcsDelivery ? "gcs" : "local"),
                    "--gateway.storage.bucket=" + (gcsDelivery ? cloudConfiguration.bucket() : ""),
                    "--gateway.storage.local-directory=" + WORK.resolve("objects"),
                    "--gateway.rendering.mode=supervised-native",
                    "--gateway.rendering.storage-process-enabled=" + storageSession,
                    "--gateway.rendering.temporary-directory=" + WORK.resolve("render"),
                    "--gateway.rendering.native-distribution=/relocated/lib",
                    "--gateway.rendering.native-distribution-sha256=" + arguments[1])) {
                details.put("phase", "context-ready");
                if (runtimeParent) {
                    long cap = LinuxWorkerMemoryAdmission.addressLimit(control("/proc/self/limits", 4096));
                    require(cap == NativeWorkerParentLimitMain.CEILING && ProcessHandle.current().children().findAny().isEmpty());
                    details.put("parentAddressSpaceAtBootstrap", cap); details.put("liveHelperAtBootstrap", false);
                }
                var properties = context.getBean(GatewayProperties.class);
                if (layout) {
                    require(properties.getLayout().getMode() == GatewayProperties.Layout.Mode.SHADOW);
                    require(context.getBean(LayoutPort.class) instanceof LocalLayoutAdapter);
                    details.put("layoutMode", "shadow-real-test-only");
                    details.put("parentVirtualAfterLayoutBootstrapBytes", LinuxWorkerMemoryAdmission.virtualBytes(control("/proc/self/status", 16384)));
                }
                details.put("renderChildHeapMiB", properties.getRendering().getChildHeapMiB());
                require(!properties.isEnabled());
                require(properties.getOcr().getMode() == GatewayProperties.Ocr.Mode.DISABLED);
                require(properties.getTranslation().getMode() == GatewayProperties.Translation.Mode.DISABLED);
                // Only test replay/synthetic ports are enabled after a credential-free bootstrap. Not a runtime option.
                properties.getTranslation().setMode(GatewayProperties.Translation.Mode.GOOGLE);
                properties.getTranslation().setEnabledPairs(scripts ? SyntheticWorkerText.languages().stream()
                    .map(target -> SyntheticWorkerText.sourceLanguage(target) + ":" + target).toList() : List.of("en:pt-BR"));
                require(context.getBean(RenderPort.class) instanceof IsolatedRenderAdapter);
                details.put("phase", "connector-check");
                var server = (TomcatWebServer) context.getWebServer();
                var connectors = server.getTomcat().getService().findConnectors();
                details.put("httpConnectorCount", connectors.length);
                require(Integer.valueOf(-1).equals(context.getEnvironment().getProperty("server.port", Integer.class)));
                var localPorts = new ArrayList<Integer>();
                var configuredPorts = new ArrayList<Integer>();
                for (var connector : connectors) {
                    localPorts.add(connector.getLocalPort());
                    configuredPorts.add(connector.getPort());
                    require(connector.getLocalPort() == -1);
                }
                details.put("httpLocalPorts", List.copyOf(localPorts));
                details.put("httpConfiguredPorts", List.copyOf(configuredPorts));
                details.put("httpListenerCount", 0);
                var mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
                details.put("phase", "security-check");
                int publicStatus = mvc.perform(get("/v1/capabilities")).andReturn().getResponse().getStatus();
                details.put("publicRouteStatus", publicStatus); require(publicStatus == 403);
                var jdbc = context.getBean(JdbcClient.class);
                details.put("phase", "schema-check");
                int migrations = context.getBean(TransactionTemplate.class).execute(ignored -> jdbc.sql(
                    "SELECT count(*) FROM flyway_schema_history WHERE success AND type = 'SQL'").query(Integer.class).single());
                details.put("migrationCount", migrations); require(migrations == 9);
                var providers = context.getBean(Providers.class);
                providers.cloudSmoke = cloudSmoke;
                providers.privateDelivery = privateDelivery;
                providers.cloudConfiguration = cloudConfiguration;
                if (recorded) providers.recorded = RecordedWorkerPage.load(Path.of("/recorded"));
                providers.scripted = scripts;
                if (scripts) { providers.targetLanguage = arguments[0].substring(painted ? "runtime-painted-".length() : "runtime-script-".length()); details.put("targetLanguage", providers.targetLanguage); }
                details.put("phase", "media-check");
                source = inspectedSource(context, ORIGINAL);
                if (recorded) require(source.sha256().equals(providers.recorded.sourceSha256()));
                details.put("inputMimeType", source.mimeType());
                var rows = new ArrayList<Map<String, Object>>(); details.put("results", rows);
                details.put("phase", "processing");
                if (recorded) {
                    var result = process(context, mvc, providers, source, providers.recorded.regions().size(), 0, 0);
                    require(Integer.valueOf(0).equals(result.get("overflowRegions")));
                    rows.add(result);
                } else if (cloudSmoke) {
                    var result = process(context, mvc, providers, source, 1, 16, providers.outputText().length());
                    require(Integer.valueOf(0).equals(result.get("overflowRegions")));
                    rows.add(result);
                } else if (sdk) {
                    rows.add(process(context, mvc, providers, source, 64, 256, 8192));
                    rows.add(process(context, mvc, providers, source, 1, 4096, 8192));
                    rows.add(process(context, mvc, providers, source, 0, 0, 0));
                    if (layout) {
                        var smallSource = inspectedSource(context, RECOVERY_ORIGINAL);
                        rows.add(process(context, mvc, providers, RECOVERY_ORIGINAL, smallSource, 1, 16, 32, false));
                    }
                    require(providers.sdk.visionCalls() == (layout ? 4 : 3) && providers.sdk.translationCalls() == (layout ? 3 : 2));
                    details.put("visionGrpcCalls", providers.sdk.visionCalls());
                    details.put("translationGrpcCalls", providers.sdk.translationCalls());
                } else if (alternateFormat) {
                    require(source.mimeType().equals("image/" + arguments[0].substring("runtime-format-".length())));
                    rows.add(process(context, mvc, providers, source, 0, 0, 0));
                    rows.add(process(context, mvc, providers, source, 1, 16, 32));
                    rows.add(process(context, mvc, providers, source, 1024, 256, 512));
                } else if (painted) {
                    rows.add(process(context, mvc, providers, source, 1, 16, 32));
                } else if (scripts) {
                    rows.add(process(context, mvc, providers, source, 1024, 256, 512));
                    rows.add(process(context, mvc, providers, source, 64, 4096, 8192));
                } else if (dimensions) {
                    boolean narrow = source.widthPx() == 1 || source.heightPx() == 1;
                    rows.add(process(context, mvc, providers, source, narrow ? 0 : 1024, narrow ? 0 : 256, narrow ? 0 : 512));
                    rows.add(process(context, mvc, providers, source, narrow ? 1 : 64, narrow ? 16 : 4096, narrow ? 32 : 8192));
                } else if (arguments[0].equals("small")) {
                    rows.add(process(context, mvc, providers, source, 0, 0, 0));
                    rows.add(process(context, mvc, providers, source, 1, 16, 32));
                } else if (arguments[0].equals("maximum") || arguments[0].equals("parent-bounded") || runtimeParent && !admittedFault) {
                    rows.add(process(context, mvc, providers, source, 1024, 256, 512));
                    rows.add(process(context, mvc, providers, source, 64, 4096, 8192));
                    rows.add(process(context, mvc, providers, source, 0, 0, 0));
                } else {
                    rows.add(process(context, mvc, providers, ORIGINAL, source, 1024, 256, 512, true));
                    Files.writeString(EXPORT.resolve("parent-before-recovery.marker"), "synthetic-test-only", StandardOpenOption.CREATE_NEW);
                    details.put("phase", "recovery");
                    var recoverySource = inspectedSource(context, RECOVERY_ORIGINAL);
                    rows.add(process(context, mvc, providers, RECOVERY_ORIGINAL, recoverySource, 1, 16, 32, false));
                    Files.writeString(EXPORT.resolve("parent-after-recovery.marker"), "synthetic-test-only", StandardOpenOption.CREATE_NEW);
                    details.put("failedJobs", cancellation ? 0 : 1);
                    if (cancellation) details.put("cancelledJobs", 1);
                }
                details.put("completedJobs", rows.size() - (arguments[0].equals("memory-fault") || preventive || admittedFault ? 1 : 0));
                if (allocationFault) {
                    var fault = context.getBean(AdmittedFaultConfiguration.class);
                    int expectedLaunches = storageSession ? 4 : 2;
                    require(fault.launches.get() == expectedLaunches && fault.injections.get() == 1);
                    require(fault.children.size() == expectedLaunches && fault.children.stream().noneMatch(Process::isAlive));
                    require(storageSession
                        ? fault.children.stream().allMatch(child -> child.exitValue() == 0)
                        : fault.children.get(0).exitValue() != 0 && fault.children.get(1).exitValue() == 0);
                    details.put("childLaunches", fault.launches.get()); details.put("faultInjections", fault.injections.get());
                    details.put("firstChildExit", fault.children.get(0).exitValue());
                    details.put("secondChildExit", fault.children.get(1).exitValue());
                    details.put("liveRenderingChildren", false);
                    details.put("faultType", diskFault ? "test-only-owned-scratch-full"
                        : storageSession ? "test-only-child-address-pressure" : "test-only-child-AS");
                    if (diskFault) {
                        if (storageSession) {
                            var pressure = context.getBean(ObjectMapper.class).readTree(Files.readAllBytes(EXPORT.resolve("session-pressure.json")));
                            fault.pressureBytes = pressure.path("bytes").longValue();
                            fault.usableAtFault = pressure.path("usable").longValue();
                        }
                        require(fault.pressureBytes > 0 && fault.usableAtFault == 0);
                        details.put("scratchPressureBytes", fault.pressureBytes);
                        details.put("scratchUsableAtFaultBytes", fault.usableAtFault);
                    } else {
                        if (storageSession) {
                            var address = context.getBean(ObjectMapper.class).readTree(Files.readAllBytes(EXPORT.resolve("session-address.json")));
                            require(address.path("phase").textValue().equals("predecode")
                                && address.path("ceilingBytes").longValue() == NativeProcessLimits.initial().addressSpaceBytes()
                                && address.path("reservedBytes").longValue() > 0);
                            details.put("reservedAddressBytes", address.path("reservedBytes").longValue());
                        }
                        if (!storageSession) details.put("injectedChildAddressSpaceBytes", AdmittedRenderFaults.FAILURE_ADDRESS_BYTES);
                    }
                }
                if (timing) {
                    var fault = context.getBean(AdmittedTimingConfiguration.class);
                    require(fault.children.size() == 2 && fault.children.stream().noneMatch(Process::isAlive));
                    require(fault.children.get(1).exitValue() == 0 && (cancellation
                        ? fault.children.getFirst().exitValue() == 0 : fault.children.getFirst().exitValue() != 0));
                    require(fault.launches.get() == 2 && fault.injections.get() == 1 && fault.busyRejected && fault.pausedObserved);
                    details.put("childLaunches", fault.launches.get()); details.put("faultInjections", fault.injections.get());
                    details.put("firstChildExit", fault.children.getFirst().exitValue()); details.put("secondChildExit", fault.children.get(1).exitValue());
                    details.put("noLiveChildrenAfterCleanup", true); details.put("busyRejectedWhileOwned", fault.busyRejected);
                    details.put("pausedOwnedChildObserved", fault.pausedObserved);
                    details.put("cancelPendingWhileRunning", fault.cancelPending);
                    details.put("callerReturnedBeforeChildRelease", fault.callerReturnedBeforeRelease);
                    details.put("inputPreservedAfterCallerTimeout", fault.inputPreserved);
                }
                details.put("phase", "complete");
                int finalOomAdjustment = LinuxOomPolicy.selfAdjustment();
                require(initialOomAdjustment == finalOomAdjustment);
                details.put("finalParentOomAdjustment", finalOomAdjustment);
                if (arguments[0].equals("parent-bounded") || runtimeParent) {
                    long observed = LinuxWorkerMemoryAdmission.addressLimit(control("/proc/self/limits", 4096));
                    long virtual = LinuxWorkerMemoryAdmission.virtualBytes(control("/proc/self/status", 16384));
                    require(observed == 3L * 1024 * 1024 * 1024 && virtual <= observed);
                    details.put("parentAddressSpaceFinalBytes", observed);
                    details.put("parentVirtualFinalBytes", virtual);
                }
                outcome = "succeeded";
            }
        } catch (Throwable error) {
            // Phase and exception type only; no raw throwable, SQL, paths, jobRef, text or provider output.
            var chain = new ArrayList<String>();
            for (var cause = error; cause != null && chain.size() < 8; cause = cause.getCause())
                chain.add(cause.getClass().getSimpleName());
            details.put("failureTypes", List.copyOf(chain));
            details.put("failureType", error.getClass().getSimpleName());
            details.put("failureLocation", Arrays.stream(error.getStackTrace())
                .filter(frame -> frame.getClassName().startsWith("com.toonlira.translationgateway."))
                .limit(4).map(frame -> frame.getClassName() + "#" + frame.getMethodName() + ":" + frame.getLineNumber()).toList());
            if (error.getMessage() != null && error.getMessage().matches("cloud-probe-[a-z0-9-]{1,80}"))
                details.put("failureCode", error.getMessage());
            if ("bootstrap".equals(details.get("phase"))) {
                try { details.put("parentVirtualAtFailureBytes", LinuxWorkerMemoryAdmission.virtualBytes(control("/proc/self/status", 16384))); }
                catch (Exception ignored) { details.put("parentVirtualAtFailureUnavailable", true); }
                try { details.put("parentAddressAtFailureBytes", LinuxWorkerMemoryAdmission.addressLimit(control("/proc/self/limits", 4096))); }
                catch (Exception ignored) { details.put("parentAddressAtFailureUnconfirmed", true); }
                try {
                    LinuxWorkerMemoryAdmission.requirePreparationEnvironment(WORK.resolve("render"), NativeProcessLimits.initial());
                    details.put("preparationEnvironmentAtFailureValid", true);
                } catch (RuntimeException ignored) { details.put("preparationEnvironmentAtFailureValid", false); }
                try {
                    NativeCodecDistribution.admitForRuntime(Path.of("/relocated/lib"), arguments[1], Duration.ofSeconds(60));
                    details.put("distributionAtFailureValid", true);
                } catch (RuntimeException ignored) { details.put("distributionAtFailureValid", false); }
            }
            if (error instanceof UnexpectedWorkerState observed) {
                details.put("unexpectedJobStatus", observed.status.name());
                details.put("stageObservations", observed.stages);
            }
        }
        try { RenderResourceMetrics.write(WORK, EXPORT, started, outcome,
            outcome.equals("succeeded") ? null : "worker-probe-failed", source, details); }
        catch (Throwable ignored) { System.exit(2); }
        if (!outcome.equals("succeeded")) System.exit(1);
    }

    private static Map<String, Object> process(ServletWebServerApplicationContext context, MockMvc mvc,
            Providers providers, RenderSource source, int count, int inputChars, int outputChars) throws Exception {
        return process(context, mvc, providers, ORIGINAL, source, count, inputChars, outputChars, false);
    }

    private static Map<String, Object> process(ServletWebServerApplicationContext context, MockMvc mvc,
            Providers providers, Path reusable, RenderSource source, int count, int inputChars, int outputChars,
            boolean expectedFailure) throws Exception {
        long started = System.nanoTime();
        var jdbc = context.getBean(JdbcClient.class); var storage = context.getBean(ObjectStoragePort.class);
        var transaction = context.getBean(TransactionTemplate.class); var gateway = context.getBean(GatewayRepository.class);
        var persistence = context.getBean(RenderingPersistenceUseCase.class);
        var reserve = context.getBean(ReserveJobUseCase.class);
        var now = Instant.now(); var installation = UUID.randomUUID(); var jobId = UUID.randomUUID();
        var jobRef = providers.recorded == null ? UUID.randomUUID() : providers.recorded.jobRef();
        transaction.executeWithoutResult(ignored -> gateway.createInstallation(installation, "synthetic-test-hash-" + installation, now));
        var originalKey = (providers.sdkEnabled ? "private/originals/" : "private/original/") + jobId;
        storage.store(originalKey, reusable, source.mimeType(), source.sha256(), now);
        reserve.execute(new GatewayRepository.NewJob(jobId, jobRef, installation, UUID.randomUUID(), UUID.randomUUID(),
            "synthetic-test-version", SyntheticWorkerText.sourceLanguage(providers.targetLanguage), providers.targetLanguage,
            source.mimeType(), source.byteSize(), source.widthPx(), source.heightPx(),
            originalKey, source.sha256(), "1".repeat(64), now, now.plus(7, ChronoUnit.DAYS)));
        var dispatch = context.getBean(DispatchPersistenceUseCase.class);
        var claim = dispatch.claim(100, now, now.plusSeconds(60)).stream()
            .filter(candidate -> candidate.jobId().equals(jobId) && candidate.jobRef().equals(jobRef)).findFirst().orElseThrow();
        require(dispatch.complete(jobId, claim.attemptCount(), now));
        providers.count = count; providers.inputChars = inputChars; providers.outputChars = outputChars;
        int oldOcr = providers.ocrCalls.get(), oldTranslation = providers.translationCalls.get();
        var body = "{\"jobRef\":\"" + jobRef + "\"}";
        performTask(context, mvc, body, installation, jobRef, jobId, source, expectedFailure);
        var completed = persistence.find(jobRef);
        if (expectedFailure) {
            boolean cancellation = context.getEnvironment().getProperty("renderer.probe.cancellation", Boolean.class, false);
            var terminal = cancellation ? JobStatus.CANCELLED : JobStatus.FAILED;
            require(completed.status() == terminal && completed.artifacts() == null);
            var failure = transaction.execute(ignored -> jdbc.sql(
                "SELECT status, error_code FROM processing_job_stages WHERE job_id = :id AND stage = 'RENDERING'")
                .param("id", jobId).query((row, index) -> Arrays.asList(row.getString("status"), row.getString("error_code"))).single());
            require((cancellation ? Arrays.asList("CANCELLED", null) : List.of("FAILED", "internal-error")).equals(failure));
            require(!Files.exists(WORK.resolve("objects").resolve(originalKey)));
            require(!Files.exists(WORK.resolve("objects").resolve(completed.ocrObjectKey())));
            require(!Files.exists(WORK.resolve("objects").resolve(completed.translationObjectKey())));
            verifyReusable(reusable, source);
            verifyRedelivery(mvc, body, providers, count, oldOcr, oldTranslation);
            var repeated = persistence.find(jobRef);
            require(repeated.status() == terminal && repeated.artifacts() == null);
            verifyTemporaryCleanup();
            if (cancellation) return Map.of("jobStatus", "CANCELLED", "renderStageStatus", "CANCELLED", "errorAbsent", true,
                "artifactsAbsent", true, "regions", count, "elapsedNanos", System.nanoTime() - started);
            return Map.of("jobStatus", "FAILED", "renderStageStatus", "FAILED", "renderErrorCode", "internal-error",
                "artifactsAbsent", true, "regions", count, "elapsedNanos", System.nanoTime() - started);
        }
        if (completed.status() != JobStatus.READY || completed.artifacts() == null) {
            var stages = transaction.execute(ignored -> jdbc.sql(
                "SELECT stage, status, error_code FROM processing_job_stages WHERE job_id = :id ORDER BY stage")
                .param("id", jobId).query((row, index) -> {
                    var stage = row.getString("stage"); var status = row.getString("status"); var code = row.getString("error_code");
                    require(List.of("QUEUED", "OCR", "TRANSLATING", "RENDERING").contains(stage));
                    require(List.of("PENDING", "RUNNING", "SUCCEEDED", "FAILED", "CANCELLED").contains(status));
                    require(code == null || Arrays.stream(GatewayErrorCode.values()).anyMatch(value -> value.value().equals(code)));
                    return Map.of("stage", stage, "status", status, "error", code == null ? "none" : code);
                }).list());
            throw new UnexpectedWorkerState(completed.status(), stages);
        }
        var artifacts = completed.artifacts();
        var manifest = read(storage, artifacts.manifestObjectKey(), 4 * 1024 * 1024);
        require(hash(manifest).equals(artifacts.manifestSha256()));
        require(hash(read(storage, artifacts.imageObjectKey(), 64 * 1024 * 1024)).equals(artifacts.image().sha256()));
        var document = context.getBean(ObjectMapper.class).readTree(manifest);
        require(document.path("policyVersion").textValue().equals(RenderPolicy.initial().version()));
        require(document.path("jobRef").textValue().equals(jobRef.toString()));
        require(document.path("originalSha256").textValue().equals(source.sha256()));
        require(document.path("sourceLanguage").textValue().equals(SyntheticWorkerText.sourceLanguage(providers.targetLanguage)));
        require(document.path("targetLanguage").textValue().equals(providers.targetLanguage));
        require(document.path("regions").size() == count);
        int overflowRegions = 0;
        for (int index = 0; index < count; index++) {
            var region = document.path("regions").get(index);
            require(region.path("id").textValue().equals((providers.recorded != null ? providers.recorded.regions().get(index).id()
                : providers.sdkEnabled ? LoopbackWorkerProviders.regionId(jobRef, index) : new UUID(0, index + 1)).toString()));
            require(region.path("readingOrder").intValue() == index);
            require(region.path("sourceText").textValue().equals(providers.recorded == null
                ? "a".repeat(inputChars) : providers.recorded.regions().get(index).sourceText()));
            require(region.path("translatedText").textValue().equals(providers.recorded == null
                ? providers.outputText() : providers.recorded.translatedText(index)));
            require(region.path("overflow").isBoolean());
            if (region.path("overflow").booleanValue()) overflowRegions++;
        }
        int succeeded = transaction.execute(ignored -> jdbc.sql(
            "SELECT count(*) FROM processing_job_stages WHERE job_id = :id AND status = 'SUCCEEDED'")
            .param("id", jobId).query(Integer.class).single());
        require(succeeded == 3);
        if (providers.cloudConfiguration == null) require(!Files.exists(WORK.resolve("objects").resolve(originalKey)));
        else CloudPrivateDeliveryProbe.requireAbsent(providers.cloudConfiguration, originalKey);
        verifyReusable(reusable, source);
        verifyRedelivery(mvc, body, providers, count, oldOcr, oldTranslation);
        require(artifacts.equals(persistence.find(jobRef).artifacts()));
        verifyTemporaryCleanup();
        if (providers.cloudSmoke || providers.recorded != null) {
            var prefix = providers.recorded == null ? "smoke" : "real-page";
            Files.write(EXPORT.resolve(prefix + ".webp"), read(storage, artifacts.imageObjectKey(), 64 * 1024 * 1024), StandardOpenOption.CREATE_NEW);
            Files.write(EXPORT.resolve(prefix + "-manifest.json"), manifest, StandardOpenOption.CREATE_NEW);
        }
        var result = new LinkedHashMap<String, Object>(Map.of("jobStatus", "READY", "succeededStages", succeeded, "regions", count,
            "imageSha256", artifacts.image().sha256(), "manifestSha256", artifacts.manifestSha256(),
            "imageBytes", artifacts.image().byteSize(), "elapsedNanos", System.nanoTime() - started,
            "inputChars", inputChars, "outputChars", outputChars, "targetLanguage", providers.targetLanguage));
        result.put("overflowRegions", overflowRegions);
        result.put("policyVersion", document.path("policyVersion").textValue());
        if (providers.privateDelivery) result.putAll(providers.cloudConfiguration == null
            ? PrivateDeliveryProbe.verify(context, installation, jobRef, jobId, originalKey, completed.ocrObjectKey(),
                completed.translationObjectKey(), artifacts.imageObjectKey(), artifacts.manifestObjectKey())
            : CloudPrivateDeliveryProbe.verify(context, providers.cloudConfiguration, installation, jobRef, jobId, originalKey,
                completed.ocrObjectKey(), completed.translationObjectKey(), artifacts.imageObjectKey(), artifacts.manifestObjectKey()));
        if (context.getBean(GatewayProperties.class).getLayout().getMode() == GatewayProperties.Layout.Mode.SHADOW) {
            var layout = transaction.execute(ignored -> jdbc.sql(
                "SELECT status, output_object_key, output_sha256, error_code FROM processing_job_layouts WHERE job_id = :id")
                .param("id", jobId).query((row, index) -> Arrays.asList(row.getString("status"), row.getString("output_object_key"),
                    row.getString("output_sha256"), row.getString("error_code"))).single());
            result.put("layoutStatus", layout.get(0));
            if ("SUCCEEDED".equals(layout.get(0))) {
                var layoutBytes = read(storage, layout.get(1), 1024 * 1024);
                require(hash(layoutBytes).equals(layout.get(2)));
                var output = context.getBean(ObjectMapper.class).readTree(layoutBytes);
                require(output.path("imageSha256").textValue().equals(source.sha256()));
                require(output.path("ocrManifestSha256").textValue().equals(hash(read(storage, completed.ocrObjectKey(), 1024 * 1024))));
                result.put("layoutSha256", layout.get(2)); result.put("layoutHashesVerified", true);
            } else {
                require(List.of("layout-unavailable", "layout-timeout", "layout-invalid-response", "layout-limit-exceeded").contains(layout.get(3)));
                result.put("layoutError", layout.get(3));
            }
        }
        return Map.copyOf(result);
    }

    private static void performTask(ServletWebServerApplicationContext context, MockMvc mvc, String body,
            UUID installation, UUID jobRef, UUID jobId, RenderSource source, boolean expectedFailure) throws Exception {
        if (!expectedFailure || !context.getEnvironment().getProperty("renderer.probe.timing-fault", Boolean.class, false)) {
            require(mvc.perform(post("/internal/tasks/ocr").contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn().getResponse().getStatus() == 204); return;
        }
        var fault = context.getBean(AdmittedTimingConfiguration.class);
        boolean timeout = context.getEnvironment().getProperty("renderer.probe.timeout", Boolean.class, false);
        try (var executor = Executors.newSingleThreadExecutor()) {
            var call = executor.submit(() -> mvc.perform(post("/internal/tasks/ocr").contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn().getResponse().getStatus());
            boolean completed = false;
            try {
                require(fault.entered.await(30, TimeUnit.SECONDS));
                require(fault.children.size() == 1 && fault.children.getFirst().isAlive() && fault.pausedObserved);
                require(!IsolatedRenderAdapter.isCallCapacityAvailable());
                try { context.getBean(RenderPort.class).render(ORIGINAL, null); invalid(); }
                catch (RenderFileException error) { require(error.failure() == RenderFileException.Failure.BUSY); fault.busyRejected = true; }
                if (timeout) {
                    require(call.get(40, TimeUnit.SECONDS) == 204);
                    require(fault.children.getFirst().isAlive() && !IsolatedRenderAdapter.isCallCapacityAvailable());
                    require(Files.exists(fault.inputSnapshot));
                    try (var input = Files.newInputStream(fault.inputSnapshot)) { require(hash(input.readAllBytes()).equals(source.sha256())); }
                    fault.inputPreserved = true; fault.callerReturnedBeforeRelease = true;
                } else {
                    var pending = context.getBean(CancelJobUseCase.class).execute(installation, jobRef);
                    require(pending.status() == JobStatus.CANCEL_PENDING);
                    var jdbc = context.getBean(JdbcClient.class);
                    var stage = jdbc.sql("SELECT status FROM processing_job_stages WHERE job_id = :id AND stage = 'RENDERING'")
                        .param("id", jobId).query(String.class).single();
                    require(stage.equals("RUNNING") && fault.children.getFirst().isAlive());
                    fault.cancelPending = true;
                    AdmittedRenderFaults.signalOwnedChild(fault.children.getFirst(), false);
                }
                fault.release.countDown();
                if (!timeout) require(call.get(45, TimeUnit.SECONDS) == 204);
                long end = System.nanoTime() + TimeUnit.SECONDS.toNanos(10);
                while (!IsolatedRenderAdapter.isCallCapacityAvailable() && System.nanoTime() < end) Thread.sleep(10);
                require(IsolatedRenderAdapter.isCallCapacityAvailable() && fault.children.stream().noneMatch(Process::isAlive));
                require(!Files.exists(fault.inputSnapshot));
                completed = true;
            } finally {
                if (!completed && !fault.children.isEmpty()) fault.children.getFirst().destroyForcibly();
                fault.release.countDown();
            }
        }
    }

    private static RenderSource inspectedSource(ServletWebServerApplicationContext context, Path reusable) throws Exception {
        var inspector = context.getBean(MediaInspectionService.class);
        try (var input = Files.newInputStream(reusable)) {
            var media = inspector.inspect(input, 12L * 1024 * 1024);
            try { return new RenderSource(media.mimeType(), media.byteSize(), media.widthPx(), media.heightPx(), media.sha256()); }
            finally { inspector.deleteQuietly(media.path()); }
        }
    }

    private static void verifyReusable(Path reusable, RenderSource source) throws Exception {
        try (var input = Files.newInputStream(reusable)) { require(hash(input.readAllBytes()).equals(source.sha256())); }
    }

    private static void verifyRedelivery(MockMvc mvc, String body, Providers providers, int count,
                                         int oldOcr, int oldTranslation) throws Exception {
        require(mvc.perform(post("/internal/tasks/ocr").contentType(MediaType.APPLICATION_JSON).content(body))
            .andReturn().getResponse().getStatus() == 204);
        require(providers.ocrCalls.get() == oldOcr + 1);
        require(providers.translationCalls.get() == oldTranslation + (count == 0 ? 0 : 1));
    }

    private static void verifyTemporaryCleanup() throws Exception {
        try (var files = Files.list(WORK.resolve("render"))) {
            var entries = files.toList();
            require(entries.isEmpty() || entries.size() == 1 && entries.getFirst().getFileName().toString().equals("render-sessions-v1"));
            if (!entries.isEmpty()) {
                var root = entries.getFirst();
                require(Files.isDirectory(root, LinkOption.NOFOLLOW_LINKS));
                try (var sessions = Files.list(root)) {
                    var remaining = sessions.toList();
                    require(remaining.size() == 1 && remaining.getFirst().getFileName().toString().equals(".owner.lock"));
                    require(Files.isRegularFile(remaining.getFirst(), LinkOption.NOFOLLOW_LINKS) && Files.size(remaining.getFirst()) == 0);
                }
            }
        }
        var snapshots = WORK.resolve("tmp/translation-media-snapshots-v1");
        require(Files.isDirectory(snapshots, LinkOption.NOFOLLOW_LINKS));
        try (var files = Files.list(snapshots)) {
            var entries = files.toList();
            require(entries.size() == 1 && entries.getFirst().getFileName().toString().equals(".owner.lock"));
            require(Files.isRegularFile(entries.getFirst(), LinkOption.NOFOLLOW_LINKS)
                && Files.size(entries.getFirst()) == 0);
        }
        try (var files = Files.list(WORK.resolve("tmp"))) {
            require(files.noneMatch(path -> !path.equals(snapshots) && path.getFileName().toString().startsWith("translation-")));
        }
    }

    private static byte[] read(ObjectStoragePort storage, String key, int limit) throws Exception {
        try (var input = storage.open(key)) {
            var bytes = input.readNBytes(limit + 1); require(bytes.length > 0 && bytes.length <= limit); return bytes;
        }
    }
    private static String hash(byte[] bytes) throws Exception { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes)); }
    private static final class UnexpectedWorkerState extends RuntimeException {
        private final JobStatus status;
        private final List<Map<String, String>> stages;
        private UnexpectedWorkerState(JobStatus status, List<Map<String, String>> stages) {
            super("worker-result-unexpected", null, false, false);
            this.status = status; this.stages = List.copyOf(stages);
        }
        @Override public String toString() { return "UnexpectedWorkerState[redacted]"; }
    }

    private static void require(boolean condition) { if (!condition) invalid(); }
    private static void invalid() { throw new IllegalStateException("worker-probe-invalid"); }

    private static Map<String, Object> boundOwnedParent() throws Exception {
        require(ProcessHandle.current().pid() == 1);
        var builder = new ProcessBuilder("/opt/java/openjdk/bin/java", "--enable-native-access=ALL-UNNAMED",
            "-Xmx64m", "-Xms16m", "-XX:MaxMetaspaceSize=64m", "-XX:CompressedClassSpaceSize=16m",
            "-XX:ReservedCodeCacheSize=32m", "-XX:MaxDirectMemorySize=64m", "-XX:+UseSerialGC", "-XX:ActiveProcessorCount=1",
            "-XX:-CreateCoredumpOnCrash", "-XX:ErrorFile=/dev/null", "-Djava.io.tmpdir=/work/tmp",
            "-Dloader.main=" + OwnedParentAddressProbe.class.getName(), "-Dloader.home=/work",
            "-Dloader.path=/probe,BOOT-INF/classes/,BOOT-INF/lib/",
            "-Dloader.config.location=classpath:/META-INF/render-child-no-config.properties", "-cp", "/app/gateway.jar",
            "org.springframework.boot.loader.launch.PropertiesLauncher", "/work")
            .directory(WORK.toFile()).redirectOutput(ProcessBuilder.Redirect.DISCARD).redirectError(ProcessBuilder.Redirect.DISCARD);
        builder.environment().clear();
        var process = builder.start();
        try {
            process.getOutputStream().close();
            require(process.waitFor(10, TimeUnit.SECONDS) && process.exitValue() == 0);
        } finally { process.destroyForcibly(); process.waitFor(); }
        var document = GatewayJsonMapper.create().readTree(control("/work/parent-limit.json", 4096));
        require(document.isObject() && document.size() == 4 && document.path("parentIdentityConfirmed").isBoolean()
            && document.path("parentIdentityConfirmed").booleanValue());
        var result = new LinkedHashMap<String, Object>(); result.put("parentIdentityConfirmed", true);
        for (var name : List.of("parentAddressSpaceLimitBytes", "parentVirtualBeforeBytes", "parentVirtualAfterBytes")) {
            require(document.path(name).isIntegralNumber() && document.path(name).longValue() > 0
                && document.path(name).longValue() <= 3L * 1024 * 1024 * 1024);
            result.put(name, document.path(name).longValue());
        }
        require((long) result.get("parentAddressSpaceLimitBytes") == 3L * 1024 * 1024 * 1024);
        return Map.copyOf(result);
    }

    private static String control(String fixedPath, int limit) throws Exception {
        try (var input = Files.newInputStream(Path.of(fixedPath))) {
            var bytes = input.readNBytes(limit + 1); require(bytes.length > 0 && bytes.length <= limit);
            return new String(bytes, StandardCharsets.US_ASCII);
        }
    }

    @Configuration(proxyBeanMethods = false)
    @Profile("renderer-resource-probe")
    @ConditionalOnProperty(name = "renderer.probe.timing-fault", havingValue = "true")
    public static class AdmittedTimingConfiguration {
        final AtomicInteger launches = new AtomicInteger(), injections = new AtomicInteger();
        final List<Process> children = new CopyOnWriteArrayList<>();
        final CountDownLatch entered = new CountDownLatch(1), release = new CountDownLatch(1);
        volatile boolean pausedObserved, busyRejected, cancelPending, inputPreserved, callerReturnedBeforeRelease;
        volatile Path inputSnapshot;
        @Bean @Primary RenderPort admittedTimingRenderer(GatewayProperties properties,
                @Value("${renderer.probe.timeout:false}") boolean timeout) {
            if (timeout) properties.getRendering().setProcessDeadline(Duration.ofSeconds(15));
            return NativeRenderingConfiguration.preparedRenderer(properties, (directory, heap) -> {
                var envelope = RenderSubprocessProtocol.readRequest(directory.resolve("request.bin"));
                var child = RenderJvmLauncher.builder(directory, heap, RenderChildMain.class.getName(), envelope.settings()).start();
                children.add(child);
                if (launches.getAndIncrement() == 0) {
                    try {
                        AdmittedRenderFaults.signalOwnedChild(child, true);
                        inputSnapshot = envelope.original(); pausedObserved = true; injections.incrementAndGet(); entered.countDown();
                        boolean interrupted = false;
                        while (true) try { release.await(); break; } catch (InterruptedException error) { interrupted = true; }
                        if (interrupted) Thread.currentThread().interrupt();
                    } catch (IOException | RuntimeException error) {
                        child.destroyForcibly();
                        boolean interrupted = Thread.interrupted();
                        while (true) try { child.waitFor(); break; } catch (InterruptedException ignored) { interrupted = true; }
                        if (interrupted) Thread.currentThread().interrupt();
                        throw error;
                    }
                }
                return child;
            });
        }
    }

    @Configuration(proxyBeanMethods = false)
    @Profile("renderer-resource-probe")
    @ConditionalOnProperty(name = "renderer.probe.admitted-fault", havingValue = "true")
    public static class AdmittedFaultConfiguration {
        final AtomicInteger launches = new AtomicInteger(), injections = new AtomicInteger();
        final List<Process> children = new CopyOnWriteArrayList<>();
        volatile long pressureBytes, usableAtFault;
        @Bean @Primary
        @ConditionalOnProperty(name = "renderer.probe.storage-session", havingValue = "true")
        RenderingTaskProcessPort admittedSessionFault(GatewayProperties properties, RenderingPersistenceUseCase persistence,
                LifecycleCleanupPersistenceUseCase cleanup, Clock clock,
                @Value("${renderer.probe.disk-fault:false}") boolean diskFault) {
            var configuration = properties.getRendering();
            var codec = NativeCodecDistribution.admitForRuntime(configuration.getNativeDistribution(),
                configuration.getNativeDistributionSha256(), configuration.getNativeTimeout());
            var admission = NativeWorkerParentPreparation.prepare(configuration.getTemporaryDirectory(), NativeProcessLimits.initial());
            return new StorageBackedRenderingTaskProcess(properties, codec, admission::requireAvailable, persistence, cleanup, clock,
                (directory, heap) -> {
                    boolean inject = launches.getAndIncrement() == 0;
                    var builder = RenderJvmLauncher.builder(directory, heap, RenderingTaskChildMain.class.getName(),
                        new BoundedNativeRenderChildSettings(codec, NativeProcessLimits.initial()));
                    if (inject) {
                        Files.createFile(directory.resolve(diskFault ? "disk-fault" : "memory-fault"));
                        var command = builder.command();
                        command.set(command.indexOf("-Dloader.main=" + RenderingTaskChildMain.class.getName()),
                            "-Dloader.main=" + RenderingSessionFaultChildMain.class.getName());
                        command.set(command.indexOf("-Dloader.path=BOOT-INF/classes/,BOOT-INF/lib/"),
                            "-Dloader.path=/probe,BOOT-INF/classes/,BOOT-INF/lib/");
                        injections.incrementAndGet();
                    }
                    var process = builder.redirectOutput(ProcessBuilder.Redirect.PIPE).start();
                    children.add(process); return process;
                });
        }
        @Bean @Primary RenderPort admittedFaultRenderer(GatewayProperties properties,
                @Value("${renderer.probe.disk-fault:false}") boolean diskFault) {
            return NativeRenderingConfiguration.preparedRenderer(properties, (directory, heap) -> {
                var file = directory.resolve("request.bin");
                if (launches.getAndIncrement() == 0) {
                    if (diskFault) {
                        pressureBytes = AdmittedRenderFaults.fillScratch(directory);
                        usableAtFault = Files.getFileStore(directory).getUsableSpace();
                    } else AdmittedRenderFaults.lowerChildAddressCeiling(file);
                    injections.incrementAndGet();
                }
                var envelope = RenderSubprocessProtocol.readRequest(file);
                var process = RenderJvmLauncher.builder(directory, heap, RenderChildMain.class.getName(), envelope.settings()).start();
                children.add(process); return process;
            });
        }
    }

    /** Diagnostic only: changes neither production admission nor the old real-kernel OOM test. */
    @Configuration(proxyBeanMethods = false)
    @Profile("renderer-resource-probe")
    @ConditionalOnProperty(name = "renderer.probe.preventive-address", havingValue = "true")
    public static class PreventiveAddressConfiguration {
        @Bean @Primary RenderPort preventiveRenderer(GatewayProperties properties) throws Exception {
            LinuxNativeProcessGuard.requirePlatform();
            LinuxOomPolicy.requireSupervisor();
            var configuration = properties.getRendering();
            var codec = NativeCodecDistribution.admit(configuration.getNativeDistribution(),
                configuration.getNativeDistributionSha256(), configuration.getNativeTimeout());
            var initial = NativeProcessLimits.initial();
            var limits = new NativeProcessLimits(PREVENTIVE_ADDRESS_BYTES, initial.cpuSeconds(), initial.fileBytes(), initial.openFiles());
            return new IsolatedRenderAdapter(configuration.getTemporaryDirectory().toRealPath(),
                new BoundedNativeRenderChildSettings(codec, limits), configuration.getProcessDeadline(), configuration.getChildHeapMiB());
        }
    }

    @Configuration(proxyBeanMethods = false)
    @Profile("renderer-resource-probe")
    public static class Providers {
        final AtomicInteger ocrCalls = new AtomicInteger(), translationCalls = new AtomicInteger();
        int count, inputChars, outputChars;
        boolean scripted, cloudSmoke, privateDelivery;
        CloudPrivateDeliveryProbe.Configuration cloudConfiguration;
        RecordedWorkerPage recorded;
        @Value("${renderer.probe.sdk-loopback:false}") boolean sdkEnabled;
        private LoopbackWorkerProviders sdk;
        String targetLanguage = "pt-BR";
        String outputText() { return cloudSmoke ? "Olá, ação e café." : scripted ? SyntheticWorkerText.text(targetLanguage, outputChars) : "b".repeat(outputChars); }
        @Bean @Primary OcrPort syntheticOcr() throws Exception {
            if (sdkEnabled) sdk = new LoopbackWorkerProviders();
            return new SyntheticOcr();
        }
        @PreDestroy void closeSdk() throws Exception { if (sdk != null) sdk.close(); }
        final class SyntheticOcr implements OcrPort {
                @Override public boolean available() { return true; }
                @Override public List<OcrManifest.Region> recognize(Command command) {
                    require(!TransactionSynchronizationManager.isActualTransactionActive()); ocrCalls.incrementAndGet();
                    if (recorded != null) return recorded.recognize(command);
                    if (sdkEnabled) return sdk.recognize(command, count, inputChars);
                    var regions = new ArrayList<OcrManifest.Region>();
                    int columns = (int) Math.ceil(Math.sqrt(count));
                    for (int index = 0; index < count; index++) {
                        double left = (double) (index % columns) / columns, top = (double) (index / columns) / columns;
                        double right = left + .9 / columns, bottom = top + .9 / columns;
                        regions.add(new OcrManifest.Region(new UUID(0, index + 1), index, "a".repeat(inputChars), List.of(
                            new OcrManifest.Vertex(left, top), new OcrManifest.Vertex(right, top),
                            new OcrManifest.Vertex(right, bottom), new OcrManifest.Vertex(left, bottom))));
                    }
                    return List.copyOf(regions);
                }
        }
        @Bean @Primary TranslationPort syntheticTranslation() {
            return request -> {
                require(!TransactionSynchronizationManager.isActualTransactionActive()); translationCalls.incrementAndGet();
                if (recorded != null) return recorded.translate(request);
                if (sdkEnabled) return sdk.translate(request, outputText());
                return new TranslationResponse(request.regions().stream()
                    .map(region -> new TranslationResponse.Region(region.id(), outputText())).toList());
            };
        }
    }
}
