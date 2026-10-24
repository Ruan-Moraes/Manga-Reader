package com.toonlira.translationgateway.infrastructure.rendering;

import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.RenderPort;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.context.annotation.Lazy;

/** Explicit local opt-in only. The parent admits files but never loads FFM or falls back to CLI. */
@Configuration(proxyBeanMethods = false)
@Profile("worker")
@ConditionalOnProperty(name = "gateway.rendering.mode", havingValue = "supervised-native")
public class NativeRenderingConfiguration {
    private static final int MIN_CHILD_HEAP_MIB = 64, MAX_CHILD_HEAP_MIB = 128;
    @Bean
    @Lazy
    @ConditionalOnMissingBean(RenderPort.class)
    RenderPort nativeRenderPort(GatewayProperties properties) {
        return preparedRenderer(properties, null);
    }

    static IsolatedRenderAdapter preparedRenderer(GatewayProperties properties, IsolatedRenderAdapter.ChildLauncher launcher) {
        try {
            LinuxNativeProcessGuard.requirePlatform();
            LinuxOomPolicy.requireSupervisor();
            var configuration = properties.getRendering(); var directory = configuration.getTemporaryDirectory();
            int heapMiB = validatedHeapMiB(configuration);
            if (directory == null || !directory.isAbsolute() || !Files.isDirectory(directory, LinkOption.NOFOLLOW_LINKS)
                || !Files.isWritable(directory)) throw new IllegalStateException();
            var codec = NativeCodecDistribution.admitForRuntime(configuration.getNativeDistribution(),
                configuration.getNativeDistributionSha256(), configuration.getNativeTimeout());
            var settings = new BoundedNativeRenderChildSettings(codec, NativeProcessLimits.initial());
            var admission = NativeWorkerParentPreparation.prepare(directory, settings.limits());
            if (launcher != null) return new IsolatedRenderAdapter(directory.toRealPath(), settings,
                configuration.getProcessDeadline(), heapMiB, launcher, admission::requireAvailable);
            return new IsolatedRenderAdapter(directory.toRealPath(), settings, configuration.getProcessDeadline(),
                heapMiB, admission::requireAvailable);
        } catch (Exception error) { throw new IllegalStateException("Renderer preparation unavailable"); }
    }

    static int validatedHeapMiB(GatewayProperties.Rendering configuration) {
        if (configuration == null || configuration.getChildHeapMiB() < MIN_CHILD_HEAP_MIB
            || configuration.getChildHeapMiB() > MAX_CHILD_HEAP_MIB) throw new IllegalStateException();
        return configuration.getChildHeapMiB();
    }

    @Bean
    SmartInitializingSingleton prepareSelectedRendererBootstrap(ObjectProvider<RenderPort> renderers) {
        // Resolve the selected port after definitions/primary overrides are known, but before refresh completes.
        // Merely making the default lazy would defer invalid native preparation until a potentially paid task.
        return () -> renderers.getObject();
    }
}
