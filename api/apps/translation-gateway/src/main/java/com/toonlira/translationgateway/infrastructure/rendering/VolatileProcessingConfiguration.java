package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.InlineOcrPort;
import com.toonlira.translationgateway.application.port.VolatileRenderPort;
import com.toonlira.translationgateway.infrastructure.ocr.VisionClientFactory;
import com.toonlira.translationgateway.infrastructure.ocr.VisionOcrAdapter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.core.env.Environment;
import java.io.IOException;

@Configuration(proxyBeanMethods = false)
@Profile("!worker")
@EnableScheduling
@ConditionalOnProperty(name = "gateway.volatile-processing-enabled", havingValue = "true")
public class VolatileProcessingConfiguration {
    @Bean
    VolatileRenderPort volatileRenderer(GatewayProperties properties, Environment environment) {
        VolatileRuntimePolicy.require(properties, environment.getProperty("spring.servlet.multipart.enabled", Boolean.class, true));
        VolatileRuntimePolicy.requireServerBudget(environment);
        VolatileProcessAdmission.require();
        var rendering = properties.getRendering();
        if (rendering.getMode() != GatewayProperties.Rendering.Mode.SUPERVISED_NATIVE
            || properties.getOcr().getMode() != GatewayProperties.Ocr.Mode.VISION
            || properties.getTranslation().getMode() != GatewayProperties.Translation.Mode.GOOGLE)
            throw new IllegalStateException("Volatile providers and isolated renderer must be configured");
        var codec = NativeCodecDistribution.admitForRuntime(rendering.getNativeDistribution(),
            rendering.getNativeDistributionSha256(), rendering.getNativeTimeout());
        var limits = NativeProcessLimits.initial();
        var admission = NativeWorkerParentPreparation.prepare(rendering.getTemporaryDirectory(), limits);
        return new IsolatedMemoryRenderAdapter(rendering.getTemporaryDirectory(),
            new BoundedNativeRenderChildSettings(codec, limits), rendering.getProcessDeadline(), () -> {
                VolatileProcessAdmission.require(); admission.requireAvailable();
            });
    }

    @Bean(destroyMethod = "close")
    VisionOcrAdapter inlineOcr(GatewayProperties properties, VisionClientFactory factory) throws IOException {
        var project = properties.getOcr().getProjectId();
        if (!project.matches("[a-z][a-z0-9-]{4,28}[a-z0-9]")) throw new IllegalStateException("Vision project unavailable");
        return new VisionOcrAdapter(factory.create(), project);
    }
}
