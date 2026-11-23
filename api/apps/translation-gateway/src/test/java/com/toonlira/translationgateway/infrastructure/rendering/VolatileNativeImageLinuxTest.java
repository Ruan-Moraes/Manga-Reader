package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.testcontainers.containers.Network;

@Tag("native-linux")
@EnabledIfSystemProperty(named = "renderer.volatile.image.enabled", matches = "true")
class VolatileNativeImageLinuxTest {
    @TempDir Path temporary;
    private static Network network;
    @BeforeAll static void prepare() { network = Network.newNetwork(); }
    @AfterAll static void close() { if (network != null) network.close(); }

    @ParameterizedTest
    @ValueSource(strings = {"runtime-private-delivery", "runtime-parent", "runtime-format-jpeg", "runtime-format-webp",
        "runtime-dimension-wide", "runtime-dimension-tall", "runtime-dimension-row", "runtime-dimension-column"})
    void deliversFromMemoryWithoutContentFilesAndRecoversCapacity(String scenario) throws Exception {
        var staging = Files.createDirectory(temporary.resolve(scenario));
        try (var fixture = new LinuxRenderContainerFixture(temporary, true)) {
            var state = fixture.nativeImageWorkerResourceProbe(staging, NativeCodecGlibcLinuxTest.pin(NativeCodecPlatform.ARM64_GLIBC),
                network.getId(), System.getProperty("renderer.native.image.arm64.id"), "volatile-" + scenario);
            var metrics = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("resource-metrics.json")));
            assertThat(state.exitCode()).as("volatile metrics %s", metrics).isZero();
            assertThat(state.oomKilled()).isFalse();
            assertThat(metrics.path("outcome").textValue()).isEqualTo("passed");
            assertThat(metrics.path("contentFiles").intValue()).isZero();
            assertThat(metrics.path("completedJobs").intValue()).isEqualTo(scenario.equals("runtime-private-delivery") ? 8 : 2);
            assertThat(metrics.path("memoryPeakBytes").longValue()).isPositive().isLessThanOrEqualTo(8L * 1024 * 1024 * 1024);
            System.out.println("volatile-render: " + metrics);
        }
    }
}
