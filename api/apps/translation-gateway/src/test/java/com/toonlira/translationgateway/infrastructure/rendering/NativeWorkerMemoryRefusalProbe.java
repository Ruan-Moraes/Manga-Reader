package com.toonlira.translationgateway.infrastructure.rendering;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import com.toonlira.translationgateway.application.config.GatewayProperties;
import com.toonlira.translationgateway.application.port.OcrPort;
import com.toonlira.translationgateway.application.port.TranslationPort;
import java.lang.management.ManagementFactory;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.time.Duration;
import java.util.Map;
import org.springframework.beans.factory.BeanCreationException;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.core.env.MapPropertySource;

/** Valid codec metadata, real cgroup, no image/provider/ADC: insufficient environment must fail at bean preparation. */
public final class NativeWorkerMemoryRefusalProbe {
    private NativeWorkerMemoryRefusalProbe() { }

    public static void main(String[] arguments) throws Exception {
        if (arguments.length != 2 || !arguments[1].equals("/work")) invalid();
        LinuxNativeProcessGuard.requirePlatform();
        LinuxOomPolicy.requireSupervisor();
        var work = Path.of("/work");
        long maximum = LinuxWorkerMemoryAdmission.finite(Files.readString(Path.of("/sys/fs/cgroup/memory.max")), false);
        if (maximum != 1024L * 1024 * 1024 || ProcessHandle.current().pid() != 1
            || ManagementFactory.getRuntimeMXBean().getInputArguments().stream().anyMatch(argument -> argument.startsWith("--enable-native-access"))) invalid();
        // Separate package admission from the intentional memory refusal; corrupt codec cannot stand in for this proof.
        NativeCodecDistribution.admitForRuntime(Path.of("/relocated/lib"), arguments[0], Duration.ofSeconds(60));
        var beforeLimits = Files.readString(Path.of("/proc/self/limits"));
        var properties = new GatewayProperties();
        var rendering = properties.getRendering();
        rendering.setMode(GatewayProperties.Rendering.Mode.SUPERVISED_NATIVE);
        rendering.setTemporaryDirectory(work);
        rendering.setNativeDistribution(Path.of("/relocated/lib"));
        rendering.setNativeDistributionSha256(arguments[0]);
        boolean refused = false;
        int providerBeans = -1;
        try (var context = new AnnotationConfigApplicationContext()) {
            context.getEnvironment().setActiveProfiles("worker");
            context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("local-refusal-probe",
                Map.of("gateway.rendering.mode", "supervised-native")));
            context.registerBean(GatewayProperties.class, () -> properties);
            context.register(NativeRenderingConfiguration.class);
            try { context.refresh(); }
            catch (BeanCreationException error) {
                refused = "Renderer preparation unavailable".equals(error.getMostSpecificCause().getMessage());
            }
            providerBeans = context.getBeanFactory().getBeanNamesForType(OcrPort.class, true, false).length
                + context.getBeanFactory().getBeanNamesForType(TranslationPort.class, true, false).length;
        }
        long liveChildren = ProcessHandle.current().children().count();
        boolean limitsUnchanged = beforeLimits.equals(Files.readString(Path.of("/proc/self/limits")));
        if (!refused || liveChildren != 0 || providerBeans != 0 || !limitsUnchanged) invalid();
        try (var entries = Files.list(work)) {
            if (entries.anyMatch(path -> path.getFileName().toString().startsWith("render-"))) invalid();
        }
        var result = Map.of("configurationRefused", true, "memoryMaximumBytes", maximum,
            "liveChildren", liveChildren, "providerBeansRegistered", providerBeans, "parentNativeAccessFlag", false,
            "parentLimitsUnchanged", limitsUnchanged);
        Files.write(work.resolve("memory-refusal.json"), GatewayJsonMapper.create().writeValueAsBytes(result), StandardOpenOption.CREATE_NEW);
    }

    private static void invalid() { throw new IllegalStateException("native-memory-refusal-probe-failed"); }
}
