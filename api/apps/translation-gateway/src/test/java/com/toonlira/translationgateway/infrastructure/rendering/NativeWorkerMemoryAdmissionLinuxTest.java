package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.junit.jupiter.api.io.TempDir;

@Tag("testcontainers")
@EnabledIfSystemProperty(named = "renderer.worker.resources.enabled", matches = "true")
class NativeWorkerMemoryAdmissionLinuxTest {
    @TempDir Path temporary;
    @BeforeAll static void preparedArchiveOnly() throws Exception { RenderArchiveNativeTest.requireCurrentArchive(); }

    @Test void validArm64PackageCannotEnableNativeWorkerAtCloudSizedBudget() throws Exception { verify(false); }

    @Test
    @EnabledIfSystemProperty(named = "renderer.amd64.enabled", matches = "true")
    void validAmd64PackageCannotEnableNativeWorkerAtCloudSizedBudget() throws Exception { verify(true); }

    private void verify(boolean amd64) throws Exception {
        var staging = Files.createDirectory(temporary.resolve("memory-refusal"));
        var prefix = amd64 ? "renderer.amd64.distribution." : "renderer.distribution.";
        try (var fixture = new LinuxRenderContainerFixture(temporary)) {
            fixture.nativeWorkerMemoryRefusal(Path.of(System.getProperty(prefix + "directory")),
                System.getProperty(prefix + "sha256"), staging, amd64);
        }
        var report = GatewayJsonMapper.create().readTree(Files.readAllBytes(staging.resolve("memory-refusal.json")));
        assertThat(report.size()).isEqualTo(6);
        assertThat(report.path("configurationRefused").isBoolean()).isTrue();
        assertThat(report.path("configurationRefused").booleanValue()).isTrue();
        assertThat(report.path("memoryMaximumBytes").isIntegralNumber()).isTrue();
        assertThat(report.path("memoryMaximumBytes").longValue()).isEqualTo(1024L * 1024 * 1024);
        assertThat(report.path("liveChildren").isIntegralNumber()).isTrue();
        assertThat(report.path("liveChildren").longValue()).isZero();
        assertThat(report.path("providerBeansRegistered").isIntegralNumber()).isTrue();
        assertThat(report.path("providerBeansRegistered").intValue()).isZero();
        assertThat(report.path("parentNativeAccessFlag").isBoolean()).isTrue();
        assertThat(report.path("parentNativeAccessFlag").booleanValue()).isFalse();
        assertThat(report.path("parentLimitsUnchanged").isBoolean()).isTrue();
        assertThat(report.path("parentLimitsUnchanged").booleanValue()).isTrue();
    }
}
