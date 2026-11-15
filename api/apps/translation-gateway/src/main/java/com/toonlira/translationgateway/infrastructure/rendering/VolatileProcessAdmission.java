package com.toonlira.translationgateway.infrastructure.rendering;

import static com.toonlira.translationgateway.infrastructure.rendering.RenderFileException.Failure.CONFIGURATION;

import com.sun.management.HotSpotDiagnosticMXBean;
import java.lang.management.ManagementFactory;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

/** No FFM in the HTTP process. Validate effective JVM flags and inherited kernel core policy before content. */
final class VolatileProcessAdmission {
    private VolatileProcessAdmission() { }
    static void require() {
        try {
            LinuxNativeProcessGuard.requirePlatform();
            var vm = ManagementFactory.getPlatformMXBean(HotSpotDiagnosticMXBean.class);
            if (vm == null || !"false".equals(vm.getVMOption("HeapDumpOnOutOfMemoryError").getValue())
                || !"false".equals(vm.getVMOption("CreateCoredumpOnCrash").getValue())
                || !"/dev/null".equals(vm.getVMOption("ErrorFile").getValue())) throw new IllegalStateException();
            try (var input = Files.newInputStream(Path.of("/proc/self/limits"))) {
                var bytes = input.readNBytes(16_385);
                if (bytes.length > 16_384 || new String(bytes, StandardCharsets.US_ASCII).lines()
                    .noneMatch(line -> line.matches("Max core file size\\s+0\\s+0\\s+bytes\\s*"))) throw new IllegalStateException();
            }
        } catch (Throwable error) { throw new RenderFileException(CONFIGURATION); }
    }
}
