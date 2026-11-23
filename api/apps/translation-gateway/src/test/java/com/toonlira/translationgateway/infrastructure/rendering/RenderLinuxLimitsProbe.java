package com.toonlira.translationgateway.infrastructure.rendering;

import tools.jackson.databind.ObjectMapper;
import com.toonlira.translationgateway.infrastructure.json.GatewayJsonMapper;
import java.lang.foreign.Arena;
import java.lang.foreign.FunctionDescriptor;
import java.lang.foreign.Linker;
import java.lang.foreign.MemorySegment;
import java.lang.foreign.ValueLayout;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;

/** Local test main only. Observes its own Linux process, never a provider, credential or production database. */
public final class RenderLinuxLimitsProbe {
    private RenderLinuxLimitsProbe() { }

    public static void main(String[] arguments) throws Throwable {
        if (arguments.length != 2) throw new AssertionError("limits-probe-configuration");
        var mode = arguments[0]; var work = Path.of(arguments[1]);
        if (!mode.equals("inspect")) LinuxNativeProcessGuard.apply(switch (mode) {
            case "guard", "address", "crash" -> NativeProcessLimits.initial();
            case "file" -> new NativeProcessLimits(NativeProcessLimits.initial().addressSpaceBytes(), 120, 8192, 128);
            case "cpu" -> new NativeProcessLimits(NativeProcessLimits.initial().addressSpaceBytes(), 2, 8192, 128);
            default -> throw new AssertionError("limits-probe-configuration");
        });
        var metrics = new LinkedHashMap<String, Object>();
        metrics.put("platform", NativeCodecPlatform.runtime().manifestId());
        metrics.put("oomScoreAdjustment", LinuxOomPolicy.selfAdjustment());
        var linker = Linker.nativeLinker();
        var processControl = linker.downcallHandle(linker.defaultLookup().findOrThrow("prctl"),
            FunctionDescriptor.of(ValueLayout.JAVA_INT, ValueLayout.JAVA_INT, ValueLayout.JAVA_LONG,
                ValueLayout.JAVA_LONG, ValueLayout.JAVA_LONG, ValueLayout.JAVA_LONG), Linker.Option.firstVariadicArg(1));
        metrics.put("dumpable", (int) processControl.invokeExact(3, 0L, 0L, 0L, 0L));
        var getter = linker.downcallHandle(linker.defaultLookup().findOrThrow("getrlimit"),
            FunctionDescriptor.of(ValueLayout.JAVA_INT, ValueLayout.JAVA_INT, ValueLayout.ADDRESS));
        try (var arena = Arena.ofConfined()) {
            var pair = arena.allocate(16, 8);
            for (var resource : new int[]{0, 1, 4, 7, 9}) {
                if ((int) getter.invokeExact(resource, pair) != 0) throw new AssertionError("getrlimit-unavailable");
                metrics.put("resource-" + resource, new long[]{pair.get(ValueLayout.JAVA_LONG, 0), pair.get(ValueLayout.JAVA_LONG, 8)});
            }
        }
        metrics.put("java", System.getProperty("java.version"));
        for (var line : Files.readAllLines(Path.of("/proc/self/status"))) {
            if (line.startsWith("VmSize:") || line.startsWith("VmRSS:") || line.startsWith("Threads:")) {
                var tokens = line.trim().split("\\s+"); metrics.put(tokens[0], Long.parseLong(tokens[1]));
            }
        }
        GatewayJsonMapper.create().writeValue(work.resolve("limits.json").toFile(), metrics);
        switch (mode) {
            case "address" -> {
                // Reserving without touching: the denied mapping tests address space, not cgroup OOM or RSS.
                var mapper = linker.downcallHandle(linker.defaultLookup().findOrThrow("mmap"),
                    FunctionDescriptor.of(ValueLayout.ADDRESS, ValueLayout.ADDRESS, ValueLayout.JAVA_LONG,
                        ValueLayout.JAVA_INT, ValueLayout.JAVA_INT, ValueLayout.JAVA_INT, ValueLayout.JAVA_LONG));
                var denied = (MemorySegment) mapper.invokeExact(MemorySegment.NULL,
                    NativeProcessLimits.initial().addressSpaceBytes(), 3, 0x22, -1, 0L);
                if (denied.address() != -1) throw new AssertionError("address-limit-not-enforced");
                try (var arena = Arena.ofConfined()) { arena.allocate(1024 * 1024).fill((byte) 1); }
                Files.writeString(work.resolve("address-denied.txt"), "denied-without-oom");
            }
            case "file" -> {
                try (var output = Files.newOutputStream(work.resolve("oversized.bin"))) {
                    for (int index = 0; index < 9; index++) output.write(new byte[1024]);
                }
                Files.writeString(work.resolve("unexpected-success.txt"), "invalid");
            }
            case "cpu" -> { while (true) Thread.onSpinWait(); }
            case "crash" -> {
                try {
                    var abort = linker.downcallHandle(linker.defaultLookup().findOrThrow("abort"), FunctionDescriptor.ofVoid());
                    Files.writeString(work.resolve("crash-started.txt"), "native-abort");
                    abort.invokeExact();
                    throw new AssertionError("fatal-signal-did-not-terminate");
                } catch (Throwable unexpected) {
                    Files.writeString(work.resolve("crash-returned.txt"), unexpected.getClass().getSimpleName());
                    throw unexpected;
                }
            }
            default -> { }
        }
    }
}
