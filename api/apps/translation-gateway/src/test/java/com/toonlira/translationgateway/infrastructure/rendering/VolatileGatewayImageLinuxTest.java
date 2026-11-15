package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import com.github.dockerjava.api.model.Ulimit;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.infrastructure.ocr.VolatileLoopbackVisionFactory;
import com.toonlira.translationgateway.infrastructure.translation.VolatileLoopbackTranslationFactory;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.nio.file.attribute.PosixFilePermissions;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Timeout;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;
import org.testcontainers.containers.BindMode;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.startupcheck.OneShotStartupCheckStrategy;
import org.testcontainers.containers.wait.strategy.Wait;

/** Entirely private local network. Separate client/server/database; no host-published ports or paid providers. */
@Tag("native-linux")
@EnabledIfSystemProperty(named = "renderer.volatile.gateway.enabled", matches = "true")
class VolatileGatewayImageLinuxTest {
    @TempDir Path temporary;
    @Test @Timeout(600)
    void authenticatedDirectPipelineUsesInlineSdkBytesAndRecoversAfterOwnedNativeFailure() throws Exception {
        String image = System.getProperty("renderer.native.image.arm64.id", "");
        assertThat(image).matches("sha256:[a-f0-9]{64}");
        var classes = Files.createDirectory(temporary.resolve("probe"));
        Files.setPosixFilePermissions(classes, PosixFilePermissions.fromString("rwxr-xr-x"));
        for (var type : List.of(VolatileGatewayIntegrationProbe.class, VolatileGatewayIntegrationClient.class,
            VolatileOwnedFaultProbe.class, VolatileLoopbackVisionFactory.class, VolatileLoopbackTranslationFactory.class)) mountClass(classes, type);
        var inputs = Files.createDirectory(temporary.resolve("inputs"));
        Files.setPosixFilePermissions(inputs, PosixFilePermissions.fromString("rwxr-xr-x"));
        var small = SyntheticResourcePng.multicolor(inputs.resolve("small.png"), 320, 220);
        var maximum = SyntheticResourcePng.multicolor(inputs.resolve("maximum.png"), 10000, 8000);
        var jpeg = inputs.resolve("maximum.jpg"); var webp = inputs.resolve("maximum.webp");
        try (var fixtures = new LinuxRenderContainerFixture(temporary, true)) {
            String manifest = System.getProperty("renderer.glibc.arm64.sha256", "");
            assertThat(manifest).matches("[a-f0-9]{64}");
            Files.copy(fixtures.prepareMaximumAlternateFormat("jpeg", image, manifest), jpeg);
            Files.copy(fixtures.prepareMaximumAlternateFormat("webp", image, manifest), webp);
        }
        var padded = padPng(maximum, inputs.resolve("maximum-padded.png"));
        for (var file : List.of(small, maximum, jpeg, webp, padded)) Files.setPosixFilePermissions(file, PosixFilePermissions.fromString("rw-r--r--"));
        var network = Network.builder().createNetworkCmdModifier(command -> command.withInternal(true)).build();
        var database = metadataDatabase(network);
        var server = volatileServer(image, classes, network);
        var client = baseContainer(image, classes, network, VolatileGatewayIntegrationClient.class, 256, 512, 32)
            .withFileSystemBind(inputs.toString(), "/inputs", BindMode.READ_ONLY)
            .withStartupCheckStrategy(new OneShotStartupCheckStrategy().withTimeout(Duration.ofMinutes(5)));
        try {
            database.start(); server.start(); client.start();
            var state = client.getCurrentContainerInfo().getState();
            var clientLog = client.getLogs();
            assertThat(state.getExitCodeLong()).as("client operational output: %s", clientLog).isZero();
            var result = clientLog.lines().filter(line -> line.startsWith("volatile-gateway-client-result:")).findFirst().orElseThrow();
            var metrics = GatewayJsonMapper.create().readTree(result.substring("volatile-gateway-client-result:".length()));
            assertThat(metrics.path("ocrCalls").intValue()).isEqualTo(12);
            assertThat(metrics.path("translationCalls").intValue()).isEqualTo(11);
            assertThat(metrics.path("contentFiles").intValue()).isZero();
            assertThat(metrics.path("pidsEvents").asText().trim()).isEqualTo("max 0");
            assertThat(metrics.path("regularFiles").intValue()).isZero();
            assertThat(server.getLogs()).doesNotContain(VolatileGatewayIntegrationProbe.SOURCE, "Bearer ",
                "pthread_create failed", "Failed to start thread", "unable to create native thread");
            System.out.println("volatile-gateway-integrated: " + metrics);
        } finally {
            try {
                var evidence = Path.of(System.getProperty("renderer.volatile.gateway.evidence", temporary.toString()));
                Files.createDirectories(evidence);
                Files.writeString(evidence.resolve("server-operational.log"), logs(server), StandardOpenOption.CREATE_NEW);
                Files.writeString(evidence.resolve("client-operational.log"), logs(client), StandardOpenOption.CREATE_NEW);
            } finally {
                try { client.close(); }
                finally { try { server.close(); } finally { try { database.close(); } finally { network.close(); } } }
            }
        }
    }
    private static Path padPng(Path source, Path destination) throws Exception {
        byte[] original = Files.readAllBytes(source);
        byte[] padding = new byte[12 * 1024 * 1024 - original.length - 12];
        byte[] type = "npAD".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        var crc = new java.util.zip.CRC32(); crc.update(type); crc.update(padding);
        try (var output = new java.io.DataOutputStream(Files.newOutputStream(destination, StandardOpenOption.CREATE_NEW))) {
            output.write(original, 0, original.length - 12);
            output.writeInt(padding.length); output.write(type); output.write(padding); output.writeInt((int) crc.getValue());
            output.write(original, original.length - 12, 12);
        }
        assertThat(Files.size(destination)).isEqualTo(12 * 1024 * 1024);
        return destination;
    }
    static GenericContainer<?> metadataDatabase(Network network) {
        return new GenericContainer<>("postgres:17-alpine").withImagePullPolicy(ignored -> false)
            .withNetwork(network).withNetworkAliases("postgres")
            .withEnv("POSTGRES_USER", "probe").withEnv("POSTGRES_DB", "volatile_probe").withEnv("POSTGRES_PASSWORD", "synthetic-fixture-only")
            .withCommand("postgres", "-c", "fsync=off")
            .withCreateContainerCmdModifier(command -> command.getHostConfig().withMemory(256L * 1024 * 1024).withMemorySwap(256L * 1024 * 1024))
            .waitingFor(Wait.forLogMessage(".*database system is ready to accept connections.*\\n", 2).withStartupTimeout(Duration.ofSeconds(60)));
    }
    static GenericContainer<?> volatileServer(String image, Path classes, Network network) {
        return baseContainer(image, classes, network, VolatileGatewayIntegrationProbe.class, 512, 8192, 64)
            .withNetworkAliases("server").withEnv("SPRING_PROFILES_ACTIVE", "volatile").withEnv("GATEWAY_ENABLED", "true")
            .withEnv("GATEWAY_VOLATILE_PROCESSING_ENABLED", "true")
            .withEnv("SPRING_DATASOURCE_URL", "jdbc:postgresql://postgres:5432/volatile_probe")
            .withEnv("SPRING_DATASOURCE_USERNAME", "probe").withEnv("SPRING_DATASOURCE_PASSWORD", "synthetic-fixture-only")
            .withEnv("GATEWAY_KEY", "volatile-local-probe").withEnv("GATEWAY_OCR_MODE", "vision").withEnv("GATEWAY_GCP_PROJECT_ID", "test-project")
            .withEnv("GATEWAY_TRANSLATION_MODE", "google").withEnv("GATEWAY_TRANSLATION_PROJECT_ID", "123456789")
            .withEnv("GATEWAY_TRANSLATION_ENABLED_PAIRS", "ja:pt-BR").withEnv("GATEWAY_RENDERING_MODE", "supervised-native")
            .withEnv("GATEWAY_DISCLOSURE_VERSION", "volatile-fixture-1").withEnv("GATEWAY_OPERATOR_NAME", "Synthetic fixture")
            .withEnv("GATEWAY_OPERATOR_CONTACT", "fixture@example.test").withEnv("GATEWAY_PRIVACY_POLICY_URL", "https://example.test/privacy")
            .withEnv("GATEWAY_TERMS_URL", "https://example.test/terms").withEnv("GATEWAY_PROVIDER_TRAINING_POLICY", "Synthetic loopback; no provider calls")
            .waitingFor(Wait.forLogMessage(".*volatile-gateway-probe-ready.*\\n", 1).withStartupTimeout(Duration.ofSeconds(90)));
    }
    static GenericContainer<?> baseContainer(String image, Path classes, Network network, Class<?> main,
                                                      int heapMiB, int memoryMiB, int pids) {
        return new GenericContainer<>(image).withImagePullPolicy(ignored -> false).withNetwork(network)
            .withFileSystemBind(classes.toString(), "/probe", BindMode.READ_ONLY)
            .withTmpFs(Map.of("/work", "rw,noexec,nosuid,nodev,size=512m,mode=1777"))
            .withCreateContainerCmdModifier(command -> {
                command.withEntrypoint("java");
                command.getHostConfig().withReadonlyRootfs(true).withMemory(memoryMiB * 1024L * 1024)
                    .withMemorySwap(memoryMiB * 1024L * 1024).withPidsLimit((long) pids).withCpuPeriod(100000L).withCpuQuota(200000L)
                    .withUlimits(List.of(new Ulimit("core", 0L, 0L)));
            }).withCommand("-Xmx" + heapMiB + "m", "-Xms16m", "-XX:ActiveProcessorCount=1", "-XX:+UseSerialGC", "-XX:MaxMetaspaceSize=192m",
                "-XX:+ExitOnOutOfMemoryError", "-XX:-HeapDumpOnOutOfMemoryError", "-XX:-CreateCoredumpOnCrash", "-XX:ErrorFile=/dev/null",
                "-Djava.awt.headless=true", "-Djava.io.tmpdir=/work", "-Dloader.main=" + main.getName(), "-Dloader.home=/app",
                "-Dloader.path=/probe,BOOT-INF/classes/,BOOT-INF/lib/", "-Dloader.config.location=classpath:/META-INF/render-child-no-config.properties",
                "-cp", "/app/gateway.jar", "org.springframework.boot.loader.launch.PropertiesLauncher");
    }
    private static String logs(GenericContainer<?> container) {
        try { return container.getContainerId() == null ? "not-created" : container.getLogs().replace(VolatileGatewayIntegrationProbe.SOURCE, "[redacted-synthetic-source]"); }
        catch (RuntimeException unavailable) { return "operational-log-unavailable:" + unavailable.getClass().getSimpleName(); }
    }
    static void mountClass(Path directory, Class<?> type) throws Exception {
        String relative = type.getName().replace('.', '/') + ".class";
        var target = directory.resolve(relative); Files.createDirectories(target.getParent());
        try (var input = type.getClassLoader().getResourceAsStream(relative)) { Files.copy(input, target); }
        for (Path parent = target.getParent(); parent.startsWith(directory); parent = parent.getParent())
            Files.setPosixFilePermissions(parent, PosixFilePermissions.fromString("rwxr-xr-x"));
        Files.setPosixFilePermissions(target, PosixFilePermissions.fromString("rw-r--r--"));
    }
}
