package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Network;
import org.testcontainers.containers.wait.strategy.Wait;

/** Cold worker with real production bootstrap/codec and official SDKs restricted to loopback fakes. */
@Tag("testcontainers")
@EnabledIfSystemProperty(named = "renderer.glibc.enabled", matches = "true")
class NativeRenderingWorkerGlibcLinuxTest {
    private static Network network;
    private static GenericContainer<?> postgres;
    @TempDir Path temporary;

    @BeforeAll static void preparedInfrastructureOnly() throws Exception {
        RenderArchiveNativeTest.requireCurrentArchive();
        network = Network.builder().createNetworkCmdModifier(command -> command.withInternal(true)).build();
        postgres = new GenericContainer<>("postgres:17-alpine").withImagePullPolicy(image -> false)
            .withNetwork(network).withNetworkAliases("postgres")
            .withEnv("POSTGRES_DB", "renderer_probe").withEnv("POSTGRES_USER", "test").withEnv("POSTGRES_PASSWORD", "test")
            .waitingFor(Wait.forLogMessage(".*database system is ready to accept connections.*\\n", 2))
            .withStartupTimeout(Duration.ofSeconds(60));
        postgres.start();
    }

    @AfterAll static void closeOwnedInfrastructure() {
        try { if (postgres != null) postgres.stop(); } finally { if (network != null) network.close(); }
    }

    @ParameterizedTest @EnumSource(value = NativeCodecPlatform.class, names = {"ARM64_GLIBC", "AMD64_GLIBC"})
    void maximumSdkWorkerCommitsReadyOnceAndCleansBothTargets(NativeCodecPlatform target) throws Exception {
        var staging = Files.createDirectory(temporary.resolve("sdk-worker"));
        LinuxRenderContainerFixture.ProbeState state;
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            state = fixture.glibcSdkWorkerResourceProbe(staging, NativeCodecGlibcLinuxTest.distribution(target),
                NativeCodecGlibcLinuxTest.pin(target), network.getId(), target == NativeCodecPlatform.AMD64_GLIBC);
        }
        NativeRenderingWorkerLinuxTest.verifySdkWorker(staging, state);
        var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
        assertThat(metrics.path("nativePlatform").textValue()).isEqualTo(target.manifestId());
        assertThat(metrics.path("parentNativeAccessFlag").isBoolean()).isTrue();
        assertThat(metrics.path("parentNativeAccessFlag").booleanValue()).isFalse();
        assertThat(metrics.path("liveHelperAtBootstrap").isBoolean()).isTrue();
        assertThat(metrics.path("liveHelperAtBootstrap").booleanValue()).isFalse();
    }
}
