package com.toonlira.translationgateway.infrastructure.rendering;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.RenderPort;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

class RenderingConfigurationTest {
    private final ApplicationContextRunner context = new ApplicationContextRunner()
        .withUserConfiguration(PropertiesConfiguration.class, RenderingConfiguration.class, NativeRenderingConfiguration.class);

    @Test void defaultNativeHeapLeavesAddressSpaceForTheMaximumJpegEncoder() throws Exception {
        var configuration = new GatewayProperties().getRendering();
        assertThat(configuration.getChildHeapMiB()).isEqualTo(128);
        try (var input = GatewayProperties.class.getResourceAsStream("/application.yml")) {
            assertThat(new String(input.readAllBytes(), StandardCharsets.UTF_8))
                .contains("GATEWAY_RENDERING_CHILD_HEAP_MIB:128");
        }
    }

    @Test void selectedNativeModeRejectsHeapsThatWouldConsumeItsMeasuredAddressHeadroom() {
        for (int heap : new int[] {64, 128}) {
            var configuration = new GatewayProperties().getRendering(); configuration.setChildHeapMiB(heap);
            assertThat(NativeRenderingConfiguration.validatedHeapMiB(configuration)).isEqualTo(heap);
        }
        for (int heap : new int[] {0, 63, 129, 256, 512}) {
            var configuration = new GatewayProperties().getRendering(); configuration.setChildHeapMiB(heap);
            assertThatThrownBy(() -> NativeRenderingConfiguration.validatedHeapMiB(configuration))
                .isInstanceOf(IllegalStateException.class).hasNoCause();
        }
        assertThatThrownBy(() -> NativeRenderingConfiguration.validatedHeapMiB(null))
            .isInstanceOf(IllegalStateException.class).hasNoCause();
    }

    @Test void providedPrimaryRendererDoesNotPrepareAnUnusedNativeDefaultButStillInitializesAtBootstrap() {
        context.withUserConfiguration(ProvidedRendererConfiguration.class)
            .withPropertyValues("spring.profiles.active=worker", "gateway.rendering.mode=supervised-native",
                "gateway.rendering.native-distribution=/private/not-prepared", "gateway.rendering.native-distribution-sha256=not-a-pin")
            .run(application -> {
                assertThat(application).hasNotFailed();
                assertThat(application.getBean(RenderPort.class)).isSameAs(ProvidedRendererConfiguration.RENDERER);
            });
    }

    @Test void testLauncherCannotBypassTheRealNativePreparation() {
        assertThatThrownBy(() -> NativeRenderingConfiguration.preparedRenderer(new GatewayProperties(),
            (directory, heap) -> { throw new AssertionError("launcher-must-not-start"); }))
            .hasMessage("Renderer preparation unavailable").hasNoCause();
    }

    @Test
    void defaultWorkerDoesNotPrepareAnyNativeOrFontResource() {
        context.withPropertyValues("spring.profiles.active=worker").run(application -> {
            assertThat(application).hasNotFailed().doesNotHaveBean(RenderPort.class);
            assertThat(application.getBean(GatewayProperties.class).getRendering().getMode())
                .isEqualTo(GatewayProperties.Rendering.Mode.DISABLED);
        });
    }

    @Test
    void publicGatewayDoesNotConstructRendererEvenWhenModeIsLocal() {
        context.withPropertyValues("gateway.rendering.mode=local").run(application ->
            assertThat(application).hasNotFailed().doesNotHaveBean(RenderPort.class));
    }

    @Test
    void enabledWorkerWithoutPreparedToolsFailsClosedWithSanitizedError() {
        context.withPropertyValues("spring.profiles.active=worker", "gateway.rendering.mode=local").run(application -> {
            assertThat(application).hasFailed();
            assertThat(application.getStartupFailure().getCause().getCause())
                .hasMessage("Renderer preparation unavailable").hasNoCause();
        });
    }

    @Test void disabledModeDoesNotInspectAnInvalidNativeDistribution() {
        context.withPropertyValues("spring.profiles.active=worker", "gateway.rendering.native-distribution=/private/not-present",
            "gateway.rendering.native-distribution-sha256=not-a-pin").run(application ->
                assertThat(application).hasNotFailed().doesNotHaveBean(RenderPort.class));
    }

    @Test void publicGatewayDoesNotConstructSupervisedNativeRenderer() {
        context.withPropertyValues("gateway.rendering.mode=supervised-native").run(application ->
            assertThat(application).hasNotFailed().doesNotHaveBean(RenderPort.class));
    }

    @Test void explicitNativeModeFailsWithoutACompleteDistributionAndNeverFallsBackToCli() {
        context.withPropertyValues("spring.profiles.active=worker", "gateway.rendering.mode=supervised-native")
            .run(application -> {
                assertThat(application).hasFailed();
                assertThat(application.getStartupFailure().getCause().getCause())
                    .hasMessage("Renderer preparation unavailable").hasNoCause();
            });
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(GatewayProperties.class)
    static class PropertiesConfiguration { }

    @Configuration(proxyBeanMethods = false)
    static class ProvidedRendererConfiguration {
        static final RenderPort RENDERER = (original, request) -> { throw new AssertionError("test-port-not-executed"); };
        @Bean @Primary RenderPort providedRenderer() { return RENDERER; }
    }
}
